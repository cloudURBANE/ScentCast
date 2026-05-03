import { Router } from "express";
import { getWeather } from "../services/weatherService";
import { buildProfile, searchFragrances } from "../services/scentEngine";
import { deepScrapeFragrance } from "../services/fallbackIntelligence";
import { searchCatalog, getCatalogEntry, saveCatalogEntry, flattenProfile } from "../services/catalogService";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.get("/weather", async (req, res) => {
  const { lat, lon } = req.query as { lat?: string; lon?: string };
  const data = await getWeather({ lat, lon });
  res.json(data);
});

router.post("/scent-profile", async (req, res) => {
  const { name, brand, imageUrl, notes, family, description, pyramid, perfumer } = req.body as {
    name?: string;
    brand?: string;
    imageUrl?: string;
    notes?: string[];
    family?: string;
    description?: string;
    pyramid?: { top: string[]; heart: string[]; base: string[] };
    perfumer?: string;
  };

  if (!name) {
    res.status(400).json({ error: "Fragrance name is required" });
    return;
  }

  const result = await buildProfile(name, brand || "", {
    notes,
    family,
    description,
    imageUrl,
    pyramid,
    perfumer,
  });
  res.json(result);
});

router.post("/search-scent", async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  // Check global catalog before hitting local dataset or scraper
  const catalogHit = await searchCatalog(query);
  if (catalogHit) {
    res.json(catalogHit);
    return;
  }

  const local = searchFragrances(query);
  if (local.length > 0) {
    const first = local[0];
    const profile = await buildProfile(first.name, first.brand, {
      notes: first.notes,
      family: first.family,
      description: first.description,
      pyramid: first.pyramid,
      perfumer: first.perfumer,
    });
    res.json(profile);
    return;
  }

  const scraped = await deepScrapeFragrance(query);
  const profile = await buildProfile(scraped.name, scraped.brand, {
    notes: scraped.notes,
    family: scraped.family,
    description: scraped.description,
    pyramid: scraped.pyramid,
    perfumer: scraped.perfumer,
  });
  res.json(profile);
});

router.post("/gemini/search", async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  // 1. Check catalog by free-text — handles "Creed Aventus", "Aventus", "Creed", etc.
  const quickHit = await searchCatalog(query);
  if (quickHit) {
    res.json(flattenProfile(quickHit));
    return;
  }

  // 2. Call AI to identify the fragrance
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Identify and provide detailed information about the fragrance: "${query}".
Return a JSON object with these exact fields:
{
  "name": "exact product name",
  "brand": "brand or perfume house name",
  "perfumer": "name of the nose / perfumer who created it, or empty string if unknown",
  "family": "primary fragrance family (e.g. Woody, Floral, Oriental, Fresh, Citrus, Fougere, Chypre, Gourmand, Amber, Aquatic)",
  "notes": ["complete", "flat", "list", "of", "all", "notes"],
  "description": "two to three sentence evocative description of the scent character and personality",
  "pyramid": {
    "top": ["top note 1", "top note 2"],
    "heart": ["heart note 1", "heart note 2"],
    "base": ["base note 1", "base note 2", "base note 3"]
  },
  "accords": ["dominant accord 1", "dominant accord 2", "dominant accord 3"]
}
Be as accurate and complete as possible with notes and pyramid. Only return valid JSON, no markdown or extra text.`
          }
        ]
      }
    ],
    config: { responseMimeType: "application/json" }
  });

  const text = response.text ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); }
      catch { res.status(500).json({ error: "Failed to parse AI response" }); return; }
    } else {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }
  }

  // 3. After AI identifies name+brand, check catalog with exact keys
  //    This catches the case where AI normalized the name differently than the query
  if (parsed.name && parsed.brand) {
    const exactHit = await getCatalogEntry(parsed.brand, parsed.name);
    if (exactHit) {
      res.json(flattenProfile(exactHit));
      return;
    }
  }

  // 4. Fresh AI result — return it; /api/scent-profile will save it to the catalog
  res.json(parsed);
});

router.post("/gemini/vision", async (req, res) => {
  const { base64, mimeType } = req.body as { base64?: string; mimeType?: string };
  if (!base64) {
    res.status(400).json({ error: "base64 image data is required" });
    return;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: (mimeType || "image/jpeg") as string
            }
          },
          {
            text: `This is an image of a perfume or fragrance bottle. Identify all visible fragrances and return a JSON array.
Each object in the array should have:
{
  "name": "exact product name",
  "brand": "brand or perfume house name",
  "perfumer": "name of the nose / perfumer who created it, or empty string if unknown",
  "family": "primary fragrance family",
  "notes": ["complete", "flat", "list", "of", "all", "notes"],
  "description": "brief evocative description of the scent",
  "pyramid": {
    "top": ["top note 1"],
    "heart": ["heart note 1"],
    "base": ["base note 1"]
  }
}
If you cannot identify the fragrance, return an empty array [].
Only return valid JSON, no markdown or extra text.`
          }
        ]
      }
    ],
    config: { responseMimeType: "application/json" }
  });

  const text = response.text ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch { parsed = []; }
    } else {
      parsed = [];
    }
  }

  const results: any[] = Array.isArray(parsed) ? parsed : [parsed];

  // For each AI-identified fragrance, check if we already have a full catalog entry
  // so the frontend gets the full profile (with scent_vector, imageUrl, etc.) immediately
  const enriched = await Promise.all(
    results.map(async (item: any) => {
      if (item.name && item.brand) {
        const hit = await getCatalogEntry(item.brand, item.name);
        if (hit) return flattenProfile(hit);
      }
      return item;
    })
  );

  res.json(enriched);
});

export default router;
