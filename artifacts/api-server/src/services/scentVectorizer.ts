import type { ParsedFragrance, Concentration } from "./scentParser";

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

type VectorKey = keyof ScentVector;

interface Rule {
  words: string[];
  weight: number;
}

const RULES: Record<VectorKey, Rule[]> = {
  freshness: [
    { words: ["bergamot", "lemon", "lime", "grapefruit", "orange", "mandarin", "yuzu", "citrus", "neroli", "petitgrain"], weight: 2.0 },
    { words: ["mint", "spearmint", "peppermint", "eucalyptus"], weight: 1.8 },
    { words: ["fresh", "aquatic", "marine", "ozone", "sea", "ocean", "water", "watery", "ozonic"], weight: 2.0 },
    { words: ["green", "grass", "basil", "violet leaf", "fig leaf", "tomato leaf"], weight: 1.2 },
    { words: ["pineapple", "apple", "pear", "melon", "cucumber", "blackcurrant"], weight: 0.9 },
    { words: ["aldehydic", "aldehydes"], weight: 0.8 },
  ],
  sweetness: [
    { words: ["vanilla", "vanillin", "ethyl vanillin"], weight: 2.5 },
    { words: ["tonka", "tonka bean", "coumarin"], weight: 2.0 },
    { words: ["honey", "beeswax", "praline", "sugar", "caramel", "butterscotch", "toffee"], weight: 2.0 },
    { words: ["chocolate", "cocoa", "coffee", "espresso"], weight: 1.8 },
    { words: ["heliotrope", "benzyl acetate", "ethyl maltol", "maltol"], weight: 1.5 },
    { words: ["peach", "apricot", "plum", "cherry", "berry", "raspberry", "strawberry", "fruity"], weight: 1.0 },
    { words: ["jasmine", "rose", "tuberose", "sweet", "ylang", "magnolia"], weight: 0.6 },
  ],
  woodiness: [
    { words: ["cedar", "cedarwood", "virginian cedar", "atlas cedar"], weight: 2.0 },
    { words: ["sandalwood", "mysore sandalwood", "australian sandalwood"], weight: 2.0 },
    { words: ["vetiver", "haitian vetiver", "javanese vetiver"], weight: 2.2 },
    { words: ["patchouli", "dark patchouli"], weight: 2.0 },
    { words: ["oud", "agarwood", "oud wood"], weight: 2.5 },
    { words: ["guaiac", "guaiac wood", "gaiac"], weight: 1.8 },
    { words: ["birch", "birch tar"], weight: 1.8 },
    { words: ["oakmoss", "treemoss", "moss"], weight: 1.5 },
    { words: ["woody", "forest", "timber", "driftwood", "bark"], weight: 1.5 },
    { words: ["pine", "fir", "spruce", "balsam fir", "pine needle"], weight: 1.2 },
    { words: ["iso e super", "ambroxan", "javanol", "bacdanol"], weight: 1.0 },
  ],
  spice: [
    { words: ["pepper", "black pepper", "pink pepper", "sichuan pepper", "white pepper"], weight: 2.5 },
    { words: ["cardamom", "cardamon"], weight: 2.2 },
    { words: ["ginger", "ginger root"], weight: 2.0 },
    { words: ["saffron", "safran"], weight: 2.5 },
    { words: ["clove", "clove bud", "eugenol"], weight: 2.0 },
    { words: ["cinnamon", "cassia", "cinnamic"], weight: 1.8 },
    { words: ["nutmeg", "mace"], weight: 1.6 },
    { words: ["cumin", "caraway"], weight: 1.5 },
    { words: ["spicy", "spice", "incense", "oud", "frankincense", "myrrh"], weight: 1.2 },
  ],
  warmth: [
    { words: ["amber", "ambergris", "grey amber"], weight: 2.5 },
    { words: ["ambroxan", "ambrette"], weight: 2.0 },
    { words: ["resin", "resinous", "benzoin", "styrax", "labdanum", "cistus", "rockrose"], weight: 2.5 },
    { words: ["balsam", "balsamic", "peru balsam", "tolu balsam"], weight: 2.0 },
    { words: ["tobacco", "tobacco leaf", "virginia tobacco", "dark tobacco"], weight: 2.0 },
    { words: ["leather", "suede", "birch tar", "castoreum"], weight: 1.8 },
    { words: ["smoke", "smoky", "smoked", "campfire", "birch smoke"], weight: 1.8 },
    { words: ["warm", "opulent", "rich", "deep", "dark", "heavy"], weight: 1.0 },
    { words: ["spices", "dry spices", "warm spices"], weight: 1.2 },
    { words: ["elemi", "olibanum", "incense"], weight: 1.5 },
  ],
  musk: [
    { words: ["musk", "white musk", "clean musk", "musks"], weight: 2.5 },
    { words: ["ambroxan", "iso e super", "hedione", "galaxolide"], weight: 1.8 },
    { words: ["ambergris", "ambrette", "exaltolide"], weight: 2.0 },
    { words: ["civet", "castoreum", "animalic", "animal"], weight: 2.0 },
    { words: ["powder", "powdery", "talcum", "iris", "orris"], weight: 1.2 },
    { words: ["skin", "skin-like", "salty skin", "clean"], weight: 1.0 },
  ],
};

const PYRAMID_WEIGHTS: Record<"top" | "heart" | "base", number> = {
  top: 0.7,
  heart: 1.0,
  base: 1.4,
};

const CONCENTRATION_BOOSTS: Record<string, { longevity: number; sillage: number }> = {
  "Extrait": { longevity: 3, sillage: 2 },
  "Parfum": { longevity: 2, sillage: 1 },
  "Eau de Parfum": { longevity: 1, sillage: 1 },
  "Eau de Toilette": { longevity: 0, sillage: 0 },
  "Eau de Cologne": { longevity: -1, sillage: -1 },
  "Body Spray": { longevity: -2, sillage: -1 },
  "Unknown": { longevity: 0, sillage: 0 },
};

function scoreText(text: string, rules: Rule[]): number {
  let score = 0;
  for (const rule of rules) {
    for (const word of rule.words) {
      if (text.includes(word)) score += rule.weight;
    }
  }
  return score;
}

function scoreLayer(notes: string[], positionWeight: number, rules: Rule[]): number {
  const text = notes.join(" ");
  return scoreText(text, rules) * positionWeight;
}

export function vectorize(parsed: ParsedFragrance): ScentVector {
  const v: Record<VectorKey, number> = {
    freshness: 0, sweetness: 0, woodiness: 0, spice: 0, warmth: 0, musk: 0
  };

  const { top, heart, base } = parsed.pyramidNotes;
  const hasPyramid = top.length > 0 || heart.length > 0 || base.length > 0;

  for (const key of Object.keys(v) as VectorKey[]) {
    const rules = RULES[key];

    if (hasPyramid) {
      v[key] +=
        scoreLayer(top, PYRAMID_WEIGHTS.top, rules) +
        scoreLayer(heart, PYRAMID_WEIGHTS.heart, rules) +
        scoreLayer(base, PYRAMID_WEIGHTS.base, rules);
    } else {
      v[key] += scoreLayer(parsed.notes, 1.0, rules);
    }

    v[key] += scoreText(parsed.description, rules) * 0.5;
  }

  const vector: any = {};
  for (const key in v) {
    let val = v[key as VectorKey];
    if (val > 0) val += 2.5;
    vector[key] = Math.min(10, Math.round(val));
  }
  return vector as ScentVector;
}

export function calculatePerformance(
  vector: ScentVector,
  family: string,
  concentration: string
): PerformanceMetrics {
  const heaviness = (vector.woodiness * 1.3 + vector.warmth * 1.2 + vector.musk * 1.0 + vector.spice * 0.5) / 4;
  let longevity = Math.round(4 + heaviness * 0.7 - vector.freshness * 0.15);
  let sillage = Math.round(3 + (
    vector.spice * 0.7 +
    vector.sweetness * 0.5 +
    vector.woodiness * 0.4 +
    vector.musk * 0.4 +
    vector.warmth * 0.3
  ) / 3);

  if (family.toLowerCase().includes("parfum") || family.toLowerCase().includes("intense")) {
    longevity += 1;
    sillage += 1;
  }

  const boost = CONCENTRATION_BOOSTS[concentration] ?? CONCENTRATION_BOOSTS["Unknown"];
  longevity += boost.longevity;
  sillage += boost.sillage;

  return {
    sillage: Math.min(10, Math.max(1, sillage)),
    longevity: Math.min(10, Math.max(1, longevity)),
  };
}

export function calculateContext(vector: ScentVector): ContextProfile {
  const profile: ContextProfile = { weather: [], occasion: [] };

  if (vector.freshness >= 5) {
    profile.weather.push("Warm", "Mild");
    profile.occasion.push("Casual", "Daytime");
  }
  if (vector.warmth >= 5 || vector.spice >= 5) {
    profile.weather.push("Cool", "Cold");
    profile.occasion.push("Evening", "Formal");
  }
  if (vector.woodiness >= 5 || vector.musk >= 5) {
    profile.occasion.push("Professional", "Social");
    if (profile.weather.length === 0) profile.weather.push("Universal");
  }
  if (vector.freshness >= 5 && vector.woodiness >= 5) {
    profile.occasion.push("Executive", "Social Dominance");
    if (!profile.weather.includes("Universal")) profile.weather.push("Universal");
  }
  if (vector.sweetness >= 6) {
    profile.occasion.push("Date Night", "Intimate");
    if (!profile.weather.includes("Cool") && !profile.weather.includes("Cold")) {
      profile.weather.push("Cool");
    }
  }
  if (vector.freshness >= 7 && vector.warmth < 4) {
    profile.occasion.push("Sport", "Outdoor");
    if (!profile.weather.includes("Warm")) profile.weather.push("Warm");
  }

  const deduped = (arr: string[]) => Array.from(new Set(arr));
  profile.weather = deduped(profile.weather);
  profile.occasion = deduped(profile.occasion);

  if (profile.weather.length === 0) profile.weather.push("Universal");
  if (profile.occasion.length === 0) profile.occasion.push("Daily Wear");

  return profile;
}
