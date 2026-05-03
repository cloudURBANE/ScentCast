import { Router } from "express";
import { getWeather } from "../services/weatherService";
import { buildProfile, searchFragrances } from "../services/scentEngine";
import { deepScrapeFragrance } from "../services/fallbackIntelligence";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.get("/weather", async (req, res) => {
  const { lat, lon } = req.query as { lat?: string; lon?: string };
  const data = await getWeather({ lat, lon });
  res.json(data);
});

router.post("/scent-profile", async (req, res) => {
  const { name, brand, imageUrl, notes, family, description, pyramid } = req.body as {
    name?: string;
    brand?: string;
    imageUrl?: string;
    notes?: string[];
    family?: string;
    description?: string;
    pyramid?: any;
  };

  if (!name) {
    res.status(400).json({ error: "Fragrance name is required" });
    return;
  }

  const result = await buildProfile(
    name,
    brand || "",
    { notes, family, description, imageUrl, pyramid }
  );
  res.json(result);
});

router.post("/search-scent", async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  const local = searchFragrances(query);
  if (local.length > 0) {
    const first = local[0];
    const profile = await buildProfile(first.name, first.brand, {
      notes: first.notes,
      family: first.family,
      description: first.description
    });
    res.json(profile);
    return;
  }

  const scraped = await deepScrapeFragrance(query);
  const profile = await buildProfile(scraped.name, scraped.brand, {
    notes: scraped.notes,
    family: scraped.family,
    description: scraped.description
  });
  res.json(profile);
});

router.post("/gemini/search", async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

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
  "name": "product name",
  "brand": "brand/house name",
  "family": "fragrance family (e.g. Woody, Floral, Oriental, Fresh, Citrus, Fougere, Chypre, Gourmand)",
  "notes": ["array", "of", "key", "notes"],
  "description": "two sentence evocative description of the scent character",
  "pyramid": {
    "top": ["top note 1", "top note 2"],
    "heart": ["heart note 1", "heart note 2"],
    "base": ["base note 1", "base note 2", "base note 3"]
  }
}
Only return valid JSON, no markdown or extra text.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }
  }

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
  "name": "product name",
  "brand": "brand/house name",
  "family": "fragrance family",
  "notes": ["array", "of", "key", "notes"],
  "description": "brief evocative description"
}
If you cannot identify the fragrance, return an empty array [].
Only return valid JSON, no markdown or extra text.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) parsed = [parsed];
    } else {
      parsed = [];
    }
  }

  res.json(Array.isArray(parsed) ? parsed : [parsed]);
});

export default router;
