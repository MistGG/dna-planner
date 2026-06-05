export type SavedGuideSource = "text" | "boarhat";

export interface SavedGuideEntry {
  section: string;
  kind: "character" | "weapon" | "wedge" | "support";
  name: string;
  quantity: number;
  portrait?: string;
  detail?: string;
  parentLabel?: string;
}

export interface SavedBuildGuide {
  id: string;
  title: string;
  mainCharacter: string;
  source: SavedGuideSource;
  sourceText?: string;
  boarhatUrl?: string;
  importedAt: number;
  entries: SavedGuideEntry[];
}
