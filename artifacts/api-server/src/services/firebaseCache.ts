import { createHash } from "crypto";

let firestoreDb: FirebaseFirestore.Firestore | null = null;
let initAttempted = false;

function cacheKey(imageUrl: string): string {
  return createHash("sha256").update(imageUrl.trim()).digest("hex");
}

function getDb(): FirebaseFirestore.Firestore | null {
  if (initAttempted) return firestoreDb;
  initAttempted = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("[firebaseCache] Missing Firebase env vars — cache disabled");
    return null;
  }

  try {
    // firebase-admin is a CJS package; use globalThis.require (injected by esbuild banner)
    const admin = globalThis.require("firebase-admin");
    const app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
    firestoreDb = app.firestore();
    console.log("[firebaseCache] Firestore connected ✓");
    return firestoreDb;
  } catch (err) {
    console.error("[firebaseCache] init failed:", err);
    return null;
  }
}

export async function getCachedImage(imageUrl: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const key = cacheKey(imageUrl);
    const doc = await db.collection("bg_cache").doc(key).get();
    if (doc.exists) {
      const data = doc.data();
      return data?.cleanImage ?? null;
    }
  } catch (err) {
    console.error("[firebaseCache] read error:", err);
  }
  return null;
}

export async function setCachedImage(imageUrl: string, cleanImage: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const key = cacheKey(imageUrl);
    await db.collection("bg_cache").doc(key).set({
      cleanImage,
      sourceUrl: imageUrl,
      createdAt: new Date().toISOString(),
    });
    console.log("[firebaseCache] cached image for key:", key.slice(0, 12) + "...");
  } catch (err) {
    console.error("[firebaseCache] write error:", err);
  }
}
