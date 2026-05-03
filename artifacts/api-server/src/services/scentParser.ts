import type { FragranceData } from "./datasetLoader";

export interface ParsedFragrance {
  notes: string[];
  family: string;
  description: string;
}

export function parseFragrance(data: FragranceData | undefined): ParsedFragrance | null {
  if (!data) return null;
  return {
    notes: data.notes || [],
    family: data.family || "unknown",
    description: (data.description || "").toLowerCase()
  };
}
