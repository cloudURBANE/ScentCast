import { createHash } from "crypto";

let firestoreDb: FirebaseFirestore.Firestore | null = null;
let initAttempted = false;

function nameKey(brand: string, name: string): string {
  const normalized = `${brand.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
  return createHash("sha256").update(normalized).digest("hex");
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

/** Look up a processed bottle image by fragrance name + brand. */
export async function getCachedImageByName(brand: string, name: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const key = nameKey(brand, name);
    const doc = await db.collection("bg_cache").doc(key).get();
    if (doc.exists) {
      const data = doc.data();
      const hit = data?.cleanImage ?? null;
      if (hit) console.log(`[firebaseCache] cache HIT — ${brand} ${name}`);
      return hit;
    }
  } catch (err) {
    console.error("[firebaseCache] read error:", err);
  }
  return null;
}

/** Store a processed bottle image keyed by fragrance name + brand. */
export async function setCachedImageByName(
  brand: string,
  name: string,
  cleanImage: string,
  sourceUrl?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const key = nameKey(brand, name);
    await db.collection("bg_cache").doc(key).set({
      cleanImage,
      brand: brand.trim(),
      name: name.trim(),
      ...(sourceUrl ? { sourceUrl } : {}),
      createdAt: new Date().toISOString(),
    });
    console.log(`[firebaseCache] cached image — ${brand} ${name}`);
  } catch (err) {
    console.error("[firebaseCache] write error:", err);
  }
}
