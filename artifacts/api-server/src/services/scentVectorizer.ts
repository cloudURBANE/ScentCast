import type { ParsedFragrance } from "./scentParser";

export interface ScentVector {
  freshness: number;
  sweetness: number;
  woodiness: number;
  spice: number;
  warmth: number;
  musk: number;
}

export interface PerformanceMetrics {
  sillage: number;
  longevity: number;
}

export interface ContextProfile {
  weather: string[];
  occasion: string[];
}

export function vectorize(parsed: ParsedFragrance): ScentVector {
  const v: Record<string, number> = { freshness: 0, sweetness: 0, woodiness: 0, spice: 0, warmth: 0, musk: 0 };

  const rules: Record<string, { words: string[]; weight: number }[]> = {
    freshness: [
      { words: ["citrus", "bergamot", "lemon", "grapefruit", "lime", "orange"], weight: 1.5 },
      { words: ["fresh", "mint", "aquatic", "marine", "ozone"], weight: 2 },
      { words: ["pineapple", "apple", "blackcurrant", "pear"], weight: 0.8 }
    ],
    sweetness: [
      { words: ["vanilla", "tonka", "honey", "praline", "sugar", "caramel"], weight: 2 },
      { words: ["pineapple", "apple", "peach", "berry", "fruity"], weight: 1 },
      { words: ["jasmine", "rose", "tuberose", "sweet"], weight: 0.5 }
    ],
    woodiness: [
      { words: ["birch", "oakmoss", "vetiver", "cedar", "sandalwood", "patchouli"], weight: 2 },
      { words: ["woody", "forest", "pine", "oud", "guaiac"], weight: 1.5 }
    ],
    spice: [
      { words: ["pepper", "cardamom", "ginger", "saffron", "clove", "cinnamon"], weight: 2.5 },
      { words: ["spicy", "incense"], weight: 1 }
    ],
    warmth: [
      { words: ["amber", "ambergris", "resin", "balsamic", "benzoin", "labdanum"], weight: 2.5 },
      { words: ["warm", "smoke", "tobacco", "leather", "spices"], weight: 1.5 }
    ],
    musk: [
      { words: ["musk", "ambroxan", "ambergris", "animalic", "civet", "castoreum"], weight: 2 },
      { words: ["clean", "powder"], weight: 1 }
    ]
  };

  const text = (parsed.description + " " + parsed.notes.join(" ")).toLowerCase();

  for (const key in rules) {
    rules[key].forEach(rule => {
      rule.words.forEach(word => {
        if (text.includes(word)) v[key] += rule.weight;
      });
    });
  }

  const vector: any = {};
  for (const key in v) {
    let val = v[key];
    if (val > 0) val += 3;
    vector[key] = Math.min(10, Math.round(val));
  }
  return vector as ScentVector;
}

export function calculatePerformance(vector: ScentVector, family: string): PerformanceMetrics {
  const heaviness = (vector.woodiness * 1.2 + vector.warmth * 1.0 + vector.musk * 0.8) / 3;
  let longevity = Math.round(4 + heaviness * 0.5 - vector.freshness * 0.1);
  let sillage = Math.round(3 + (vector.spice * 0.6 + vector.sweetness * 0.4 + vector.woodiness * 0.3 + vector.musk * 0.3));
  if (family.toLowerCase().includes("parfum") || family.toLowerCase().includes("intense")) {
    longevity += 1;
    sillage += 1;
  }
  return {
    sillage: Math.min(10, Math.max(2, sillage)),
    longevity: Math.min(10, Math.max(2, longevity))
  };
}

export function calculateContext(vector: ScentVector): ContextProfile {
  const profile: ContextProfile = { weather: [], occasion: [] };
  if (vector.freshness > 5) { profile.weather.push("Warm", "Mild"); profile.occasion.push("Casual", "Daytime"); }
  if (vector.warmth > 5 || vector.spice > 5) { profile.weather.push("Cool", "Cold"); profile.occasion.push("Evening", "Formal"); }
  if (vector.woodiness > 5 || vector.musk > 5) { profile.occasion.push("Professional", "Social", "Formal"); if (profile.weather.length === 0) profile.weather.push("Universal"); }
  if (vector.freshness > 5 && vector.woodiness > 5) { profile.occasion.push("Executive", "Social Dominance"); profile.weather.push("Universal"); }
  if (profile.weather.length === 0) profile.weather.push("Universal");
  if (profile.occasion.length === 0) profile.occasion.push("Daily Wear");
  return profile;
}
