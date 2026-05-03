import { loadDataset, type FragranceData } from "./datasetLoader";
import { parseFragrance } from "./scentParser";
import { vectorize, calculatePerformance, calculateContext, type ScentVector, type PerformanceMetrics, type ContextProfile } from "./scentVectorizer";
import { searchImageUrl } from "./imageService";
import { removeBg } from "./bgService";

export interface ScentProfile {
  product: { name: string; brand: string; perfumer?: string };
  scent_vector: ScentVector;
  performance: PerformanceMetrics;
  context: ContextProfile;
  notes: string[];
  pyramid?: { top: string[]; heart: string[]; base: string[] };
  family: string;
  concentration: string;
  accords: string[];
  imageUrl?: string;
  description?: string;
  error?: string;
}

function findFragrance(name: string, brand: string): FragranceData | undefined {
  const dataset = loadDataset();
  const searchName = name.toLowerCase();
  const searchBrand = brand.toLowerCase();
  const combined = `${brand} ${name}`.toLowerCase().trim();

  return dataset.find(item => {
    const itemName = item.name.toLowerCase();
    const itemBrand = item.brand.toLowerCase();
    const full = `${itemBrand} ${itemName}`.toLowerCase();
    return (
      (itemBrand === searchBrand && itemName.includes(searchName)) ||
      (brand === "" && itemName.includes(searchName)) ||
      (brand === "" && full.includes(searchName)) ||
      itemName === searchName ||
      full === combined
    );
  });
}

export function searchFragrances(query: string): FragranceData[] {
  const dataset = loadDataset();
  const q = query.toLowerCase();
  return dataset.filter(item => {
    const itemName = item.name.toLowerCase();
    const itemBrand = item.brand.toLowerCase();
    const full = `${itemBrand} ${itemName}`.toLowerCase();
    return itemName.includes(q) || itemBrand.includes(q) || full.includes(q);
  });
}

export async function buildProfile(
  name: string,
  brand: string,
  fallback?: {
    notes?: string[];
    family?: string;
    description?: string;
    imageUrl?: string;
    pyramid?: { top: string[]; heart: string[]; base: string[] };
    perfumer?: string;
  }
): Promise<ScentProfile | { error: string }> {
  let finalImageUrl = fallback?.imageUrl;

  try {
    const searchQuery = `${brand} ${name} single fragrance bottle no box HQ`;
    const searchRes = await searchImageUrl(searchQuery);
    if (searchRes && !searchRes.includes("unsplash-placeholder")) {
      finalImageUrl = searchRes;
    }
  } catch {
    finalImageUrl = fallback?.imageUrl;
  }

  let cleanImageUrl = finalImageUrl;
  if (finalImageUrl) {
    try {
      const bgResult = await removeBg(finalImageUrl, true);
      if (bgResult.cleanImage) cleanImageUrl = bgResult.cleanImage;
    } catch {
      // keep original
    }
  }

  const match = findFragrance(name, brand);
  const finalName = match?.name || name;
  const finalBrand = match?.brand || brand;
  const finalNotes = match?.notes || fallback?.notes || [];
  const finalFamily = match?.family || fallback?.family || "Unknown Family";
  const finalDescription = match?.description || fallback?.description || "";
  const finalPyramid = match?.pyramid || fallback?.pyramid;
  const finalPerfumer = match?.perfumer || fallback?.perfumer;

  if (!match && (!fallback || !fallback.notes)) {
    return { error: "Could not identify this fragrance. Try a more specific name." };
  }

  const parsed = parseFragrance({
    name: finalName,
    brand: finalBrand,
    notes: finalNotes,
    family: finalFamily,
    description: finalDescription,
    pyramid: finalPyramid,
    perfumer: finalPerfumer,
  } as FragranceData);

  if (!parsed) return { error: "Failed to parse fragrance data." };

  const vector = vectorize(parsed);
  const performance = calculatePerformance(vector, finalFamily, parsed.concentration);
  const context = calculateContext(vector);

  return {
    product: {
      name: finalName,
      brand: finalBrand,
      ...(parsed.perfumer ? { perfumer: parsed.perfumer } : {}),
    },
    scent_vector: vector,
    performance,
    context,
    notes: finalNotes,
    pyramid: finalPyramid,
    family: finalFamily,
    concentration: parsed.concentration,
    accords: parsed.accords,
    imageUrl: cleanImageUrl,
    description: finalDescription,
  };
}
