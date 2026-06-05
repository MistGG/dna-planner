import { characters, weapons, wedges } from "../data";
import { ELEMENT_COLORS } from "../constants";
import type { CollectionEntry } from "../types/collector";
import type { QueueGroup } from "./collectionQueue";
import { resolveCollectionItem } from "./collectionItems";

export interface BoardSpace {
  entry: CollectionEntry;
  globalIndex: number;
  groupIndex: number;
  isParent: boolean;
  name: string;
  portrait: string;
  subtitle?: string;
  accent: string;
  wedgeRarity?: string;
}

export interface BoardRegion {
  index: number;
  parentName: string;
  parentType: "character" | "weapon";
  spaces: BoardSpace[];
  collected: number;
  total: number;
}

function accentForEntry(entry: CollectionEntry): string {
  if (entry.type === "character") {
    const c = characters.find((x) => x.id === entry.itemId);
    return c ? (ELEMENT_COLORS[c.element] ?? "#c9a45c") : "#c9a45c";
  }
  if (entry.type === "weapon") {
    const w = weapons.find((x) => x.id === entry.itemId);
    return w ? (ELEMENT_COLORS[w.element] ?? "#c9a45c") : "#c9a45c";
  }
  return "#9d7ed8";
}

export function buildBoardRegions(groups: QueueGroup[]): BoardRegion[] {
  let globalIndex = 0;

  return groups.map((group, groupIndex) => {
    const parentResolved = resolveCollectionItem(group.parent);
    const spaces: BoardSpace[] = [];

    spaces.push({
      entry: group.parent,
      globalIndex: globalIndex++,
      groupIndex,
      isParent: true,
      name: parentResolved?.name ?? "Unknown",
      portrait: parentResolved?.portrait ?? "",
      subtitle: parentResolved?.subtitle,
      accent: accentForEntry(group.parent),
    });

    for (const wedge of group.wedges) {
      const resolved = resolveCollectionItem(wedge);
      const wedgeData = wedges.find((w) => w.id === wedge.itemId);
      spaces.push({
        entry: wedge,
        globalIndex: globalIndex++,
        groupIndex,
        isParent: false,
        name: resolved?.name ?? "Wedge",
        portrait: resolved?.portrait ?? "",
        subtitle: resolved?.subtitle,
        accent: accentForEntry(wedge),
        wedgeRarity: wedgeData?.rarity,
      });
    }

    const collected = spaces.filter((s) => s.entry.collected).length;

    return {
      index: groupIndex + 1,
      parentName: parentResolved?.name ?? "Expedition",
      parentType: group.parent.type as "character" | "weapon",
      spaces,
      collected,
      total: spaces.length,
    };
  });
}

export function flatBoardSpaces(regions: BoardRegion[]): BoardSpace[] {
  return regions.flatMap((r) => r.spaces);
}

/** Index of the next space to conquer; equals total when complete. */
export function boardFrontierIndex(spaces: BoardSpace[]): number {
  const next = spaces.findIndex((s) => !s.entry.collected);
  return next === -1 ? spaces.length : next;
}

export function milestonePercents(): number[] {
  return [25, 50, 75, 100];
}
