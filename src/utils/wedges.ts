import { ELEMENTS } from "../constants";
import type { Character, DemonWedge, WedgeCategory, Weapon } from "../types";

export function getWedgeCategory(wedge: DemonWedge): WedgeCategory {
  const r = wedge.restriction;
  if (r.includes("Melee Consonance Weapon")) return "melee-consonance";
  if (r.includes("Ranged Consonance Weapon")) return "ranged-consonance";
  if (r.includes("Melee Weapon")) return "melee";
  if (r.includes("Ranged Weapon")) return "ranged";
  return "character";
}

export function wedgeDisplayName(wedge: DemonWedge): string {
  return wedge.subname ? `${wedge.name} — ${wedge.subname}` : wedge.name;
}

export function wedgeSlotLabel(wedge: DemonWedge): string {
  const category = getWedgeCategory(wedge);
  switch (category) {
    case "character":
      return "Character";
    case "melee-consonance":
      return "Melee Consonance";
    case "ranged-consonance":
      return "Ranged Consonance";
    case "melee":
      return "Melee Weapon";
    case "ranged":
      return "Ranged Weapon";
  }
}

export function wedgeElementLabel(wedge: DemonWedge): string | undefined {
  return wedge.restriction.find((r) =>
    (ELEMENTS as readonly string[]).includes(r)
  );
}

export function wedgeMetaDetail(wedge: DemonWedge): string {
  const parts = [wedgeSlotLabel(wedge)];
  const element = wedgeElementLabel(wedge);
  if (element) parts.push(element);
  parts.push(`T${wedge.tolerance}`);
  return parts.join(" · ");
}

function wedgeRarityTier(rarity: string | undefined): "2" | "3" | "4" | "5" | null {
  const tier = rarity?.charAt(0);
  if (tier === "2" || tier === "3" || tier === "4" || tier === "5") return tier;
  return null;
}

/** Shared rarity class used across cards, panels, and rows */
export function wedgeRarityClass(rarity: string | undefined): string {
  const tier = wedgeRarityTier(rarity);
  return tier ? `wedge-rarity-${tier}` : "";
}

export function queueWedgeRarityClass(rarity: string | undefined): string {
  const tier = wedgeRarityTier(rarity);
  return tier ? `queue-row--wedge-${tier}` : "";
}

export function boardWedgeRarityClass(rarity: string | undefined): string {
  const tier = wedgeRarityTier(rarity);
  return tier ? `board-space--wedge-${tier}` : "";
}

export function wedgeUniqueKey(wedge: DemonWedge): string {
  return `${wedge.name}|${wedge.subname}|${wedge.rarity}`;
}

export function filterWedgesByCategory(
  wedges: DemonWedge[],
  category: WedgeCategory
): DemonWedge[] {
  return wedges.filter((w) => getWedgeCategory(w) === category);
}

export function wedgeMatchesCharacter(
  wedge: DemonWedge,
  character: Character | null
): boolean {
  if (!character) return true;
  const r = wedge.restriction;
  if (r.includes("Exclusive")) return false;
  if (r.includes(character.element)) return true;
  if (!r.some((x) =>
    ["Lumino", "Umbro", "Hydro", "Pyro", "Electro", "Anemo"].includes(x)
  )) {
    return true;
  }
  return false;
}

export function wedgeMatchesWeapon(
  wedge: DemonWedge,
  weapon: Weapon | null,
  character: Character | null
): boolean {
  if (!weapon) return true;
  const r = wedge.restriction;
  if (r.includes("Exclusive")) return false;
  if (r.includes(weapon.element) || r.includes("Neutral")) return true;
  if (weapon.element === "Neutral" && !r.some((x) =>
    ["Lumino", "Umbro", "Hydro", "Pyro", "Electro", "Anemo"].includes(x)
  )) {
    return true;
  }
  if (character && r.includes(character.element)) return true;
  return !r.some((x) =>
    ["Lumino", "Umbro", "Hydro", "Pyro", "Electro", "Anemo"].includes(x)
  );
}

export function totalTolerance(wedgeIds: (string | null)[], all: DemonWedge[]): number {
  return wedgeIds.reduce((sum, id) => {
    if (!id) return sum;
    const w = all.find((x) => x.id === id);
    return sum + (w ? parseInt(w.tolerance, 10) || 0 : 0);
  }, 0);
}
