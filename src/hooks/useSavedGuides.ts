import { useCallback, useEffect, useState } from "react";
import type { SavedBuildGuide } from "../types/savedGuide";

const STORAGE_KEY = "dna-collector-guides";

function loadGuides(): SavedBuildGuide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedBuildGuide[];
  } catch {
    /* ignore */
  }
  return [];
}

export function useSavedGuides() {
  const [guides, setGuides] = useState<SavedBuildGuide[]>(loadGuides);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
  }, [guides]);

  const saveGuide = useCallback((guide: SavedBuildGuide) => {
    setGuides((current) => [guide, ...current]);
  }, []);

  const removeGuide = useCallback((id: string) => {
    setGuides((current) => current.filter((g) => g.id !== id));
  }, []);

  return { guides, saveGuide, removeGuide };
}
