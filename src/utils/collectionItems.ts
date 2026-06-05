import { characters, weapons, wedges } from "../data";
import {
  formatTarget,
  type CollectionEntry,
  type CollectionType,
} from "../types/collector";
import { resolveParentById, wedgeSlotLabel } from "./wedgeCompat";
import { wedgeDisplayName, wedgeElementLabel } from "./wedges";

export interface ResolvedCollectionItem {
  name: string;
  portrait: string;
  subtitle?: string;
}

export function resolveCollectionItem(
  entry: CollectionEntry
): ResolvedCollectionItem | null {
  switch (entry.type) {
    case "character": {
      const c = characters.find((x) => x.id === entry.itemId);
      if (!c) return null;
      return {
        name: c.name,
        portrait: c.portrait,
        subtitle: `${c.element} · ${c.role} · ${formatTarget(entry)}`,
      };
    }
    case "weapon": {
      const w = weapons.find((x) => x.id === entry.itemId);
      if (!w) return null;
      return {
        name: w.name,
        portrait: w.portrait,
        subtitle: `${w.type} · ${w.element} · ${formatTarget(entry)}`,
      };
    }
    case "wedge": {
      const w = wedges.find((x) => x.id === entry.itemId);
      if (!w) return null;
      const parent = entry.parentId
        ? resolveParentById(entry.parentId)
        : null;
      return {
        name: wedgeDisplayName(w),
        portrait: w.portrait,
        subtitle: [
          wedgeSlotLabel(w),
          wedgeElementLabel(w),
          `T${w.tolerance}`,
          formatTarget(entry),
          parent ? `for ${parent.name}` : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }
  }
}

export function typeLabel(type: CollectionType): string {
  switch (type) {
    case "character":
      return "Character";
    case "weapon":
      return "Weapon";
    case "wedge":
      return "Demon Wedge";
  }
}
