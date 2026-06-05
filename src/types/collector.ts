export type CollectionType = "character" | "weapon" | "wedge";

export const MAX_INTRON = 6;
export const MAX_ITEM_COPIES = 20;

export interface CollectionEntry {
  id: string;
  type: CollectionType;
  itemId: string;
  /** Characters: intron level 1–6. Weapons/wedges: copy count. */
  target: number;
  collected: boolean;
  addedAt: number;
  /** Wedges only — id of parent character/weapon entry. */
  parentId?: string;
}

export function collectionKey(
  type: CollectionType,
  itemId: string,
  parentId?: string
): string {
  if (type === "wedge" && parentId) return `wedge:${itemId}@${parentId}`;
  return `${type}:${itemId}`;
}

export function defaultTarget(_type: CollectionType): number {
  return 1;
}

export function normalizeTarget(type: CollectionType, value: unknown): number {
  const n = typeof value === "number" ? value : 1;
  if (type === "character") {
    return Math.min(MAX_INTRON, Math.max(1, Math.round(n)));
  }
  return Math.min(MAX_ITEM_COPIES, Math.max(1, Math.round(n)));
}

export function formatTarget(entry: CollectionEntry): string {
  if (entry.type === "character") {
    return `Intron I${entry.target}`;
  }
  return entry.target === 1 ? "1 copy" : `${entry.target} copies`;
}
