import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, userFragrancesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getCatalogEntry } from "../services/catalogService";

const router = Router();

async function getUserByToken(token: string) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.token, token as any))
    .limit(1);
  return users[0] ?? null;
}

function getToken(req: any): string | null {
  const auth = req.headers["authorization"] as string | undefined;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** Strip base64 data URLs — they're huge and already stored in the global catalog */
function sanitizeFragrance(fragrance: Record<string, any>): Record<string, any> {
  const clean = { ...fragrance };
  if (typeof clean.imageUrl === "string" && clean.imageUrl.startsWith("data:")) {
    clean.imageUrl = "";
  }
  return clean;
}

/** Fill in imageUrl from the global catalog if the stored record has none */
async function hydrateImageUrl(fragrance: Record<string, any>): Promise<Record<string, any>> {
  if (fragrance.imageUrl) return fragrance;
  const name = fragrance.name as string | undefined;
  const brand = fragrance.brand as string | undefined;
  if (!name || !brand) return fragrance;
  try {
    const catalog = await getCatalogEntry(brand, name);
    if (catalog?.imageUrl) return { ...fragrance, imageUrl: catalog.imageUrl };
  } catch {
    /* non-fatal */
  }
  return fragrance;
}

router.get("/wardrobe", async (req, res) => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getUserByToken(token);
  if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

  const rows = await db
    .select()
    .from(userFragrancesTable)
    .where(eq(userFragrancesTable.userId, user.id));

  const fragrances = await Promise.all(
    rows.map(async (r) => {
      const data = r.fragranceData as Record<string, any>;
      const hydrated = await hydrateImageUrl(data);
      return { ...hydrated, _dbId: r.id };
    })
  );

  res.json(fragrances);
});

router.post("/wardrobe", async (req, res) => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getUserByToken(token);
  if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

  const fragrance = req.body;
  if (!fragrance || !fragrance.id) {
    res.status(400).json({ error: "Fragrance data with id is required" });
    return;
  }

  const clean = sanitizeFragrance(fragrance);

  const [row] = await db
    .insert(userFragrancesTable)
    .values({ userId: user.id, fragranceData: clean })
    .returning();

  const hydrated = await hydrateImageUrl(row.fragranceData as Record<string, any>);
  res.json({ ...hydrated, _dbId: row.id });
});

router.delete("/wardrobe/:id", async (req, res) => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getUserByToken(token);
  if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

  const { id } = req.params;

  const rows = await db
    .select()
    .from(userFragrancesTable)
    .where(eq(userFragrancesTable.userId, user.id));

  const match = rows.find((r) => {
    const data = r.fragranceData as any;
    return data?.id === id || r.id === id;
  });

  if (!match) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .delete(userFragrancesTable)
    .where(eq(userFragrancesTable.id, match.id));

  res.json({ success: true });
});

export default router;
