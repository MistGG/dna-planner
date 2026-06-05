import type { Character, DemonWedge, Weapon } from "../types";

export function matchesSearch(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesWedgeSearch(
  name: string,
  subname: string,
  query: string
): boolean {
  const full = normalizeSearchText(subname ? `${name} ${subname}` : name);
  const q = normalizeSearchText(query);
  if (!q) return true;
  if (full.includes(q)) return true;
  const parts = q.split(" ").filter(Boolean);
  return parts.length > 0 && parts.every((part) => full.includes(part));
}

export function filterCharacters(
  items: Character[],
  filters: {
    search: string;
    element: string;
    role: string;
    proficiency: string;
  }
): Character[] {
  return items.filter((c) => {
    if (filters.search && !matchesSearch(c.name, filters.search)) return false;
    if (filters.element && c.element !== filters.element) return false;
    if (filters.role && c.role !== filters.role) return false;
    if (filters.proficiency && !c.proficiency.includes(filters.proficiency))
      return false;
    return true;
  });
}

export function filterWeapons(
  items: Weapon[],
  filters: {
    search: string;
    element: string;
    type: string;
    attackType: string;
  }
): Weapon[] {
  return items.filter((w) => {
    if (filters.search && !matchesSearch(w.name, filters.search)) return false;
    if (filters.element && w.element !== filters.element) return false;
    if (filters.type && w.type !== filters.type) return false;
    if (filters.attackType && w.attackType !== filters.attackType) return false;
    return true;
  });
}

export function filterWedgeList(
  items: DemonWedge[],
  filters: {
    search: string;
    rarity: string;
    polarity: string;
    restriction: string;
    source: string;
  }
): DemonWedge[] {
  return items.filter((w) => {
    if (filters.search && !matchesWedgeSearch(w.name, w.subname, filters.search))
      return false;
    if (filters.rarity && w.rarity !== filters.rarity) return false;
    if (filters.polarity && w.polarity !== filters.polarity) return false;
    if (filters.restriction && !w.restriction.includes(filters.restriction))
      return false;
    if (filters.source && !w.sourceLevel.includes(filters.source)) return false;
    return true;
  });
}

export function weaponFitsCharacter(
  weapon: Weapon,
  character: Character | null
): boolean {
  if (!character) return true;
  return character.proficiency.includes(weapon.type);
}
