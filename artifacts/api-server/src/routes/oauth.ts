import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * Google requires redirect_uri exactly `{origin}/api/auth/google/callback`.
 * Env is often pasted as the full callback URL — normalize to scheme + host only.
 */
function apiPublicOriginFromEnv(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return "";
  try {
    const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return new URL(withScheme).origin;
  } catch {
    return t.replace(/\/+$/, "");
  }
}

/** Public origin of this API (used for Google OAuth redirect_uri). */
function getApiPublicUrl(req: import("express").Request): string {
  const explicit =
    process.env.API_PUBLIC_URL?.trim() || process.env.OAUTH_REDIRECT_ORIGIN?.trim();
  if (explicit) {
    return apiPublicOriginFromEnv(explicit);
  }
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    return `https://${domains.split(",")[0]}`;
  }
  const dev = process.env.REPLIT_DEV_DOMAIN;
  if (dev) {
    return `https://${dev}`;
  }
  return `${req.protocol}://${req.get("host")}`;
}

/** Where to send the user after OAuth (Vercel app when API is on another host). */
function getFrontendBaseUrl(req: import("express").Request): string {
  const fromEnv =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.FRONTEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return getApiPublicUrl(req);
}

router.get("/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "Google OAuth is not configured" });
    return;
  }

  const redirectUri = `${getApiPublicUrl(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/auth/google/callback", async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(503).send("Google OAuth is not configured");
    return;
  }

  const code = req.query.code as string | undefined;
  if (!code) {
    res.redirect(`${getFrontendBaseUrl(req)}/?oauth_error=no_code`);
    return;
  }

  try {
    const redirectUri = `${getApiPublicUrl(req)}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      res.redirect(`${getFrontendBaseUrl(req)}/?oauth_error=token_exchange`);
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.redirect(`${getFrontendBaseUrl(req)}/?oauth_error=user_info`);
      return;
    }

    const googleUser = (await userRes.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
    };

    if (!googleUser.email || !googleUser.sub) {
      res.redirect(`${getFrontendBaseUrl(req)}/?oauth_error=missing_email`);
      return;
    }

    const email = googleUser.email.toLowerCase();
    const subject = googleUser.sub;

    let user = (
      await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.oauthProvider, "google"), eq(usersTable.oauthSubject, subject)))
        .limit(1)
    )[0];

    if (!user) {
      const byEmail = (
        await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1)
      )[0];

      if (byEmail) {
        const [updated] = await db
          .update(usersTable)
          .set({ oauthProvider: "google", oauthSubject: subject })
          .where(eq(usersTable.id, byEmail.id))
          .returning();
        user = updated;
      } else {
        const [created] = await db
          .insert(usersTable)
          .values({ email, oauthProvider: "google", oauthSubject: subject })
          .returning();
        user = created;
      }
    }

    const params = new URLSearchParams({
      oauth_token: user.token,
      oauth_email: user.email,
    });

    res.redirect(`${getFrontendBaseUrl(req)}/?${params}`);
  } catch (err) {
    req.log.error(err, "Google OAuth callback error");
    res.redirect(`${getFrontendBaseUrl(req)}/?oauth_error=server_error`);
  }
});

export default router;
