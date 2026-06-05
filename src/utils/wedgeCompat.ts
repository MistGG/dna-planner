import { characters, weapons } from "../data";
import { MELEE_WEAPON_TYPES, RANGED_WEAPON_TYPES } from "../constants";
import type { Character, DemonWedge } from "../types";
import type { CollectionEntry } from "../types/collector";
import {
  getWedgeCategory,
  wedgeMatchesCharacter,
  wedgeMatchesWeapon,
  wedgeSlotLabel as wedgeSlotLabelFromWedges,
} from "./wedges";

export function isMeleeWeaponType(type: string): boolean {
  return (MELEE_WEAPON_TYPES as readonly string[]).includes(type);
}

export function isRangedWeaponType(type: string): boolean {
  return (RANGED_WEAPON_TYPES as readonly string[]).includes(type);
}

export function characterHasMeleeProficiency(character: Character): boolean {
  return character.proficiency.some(isMeleeWeaponType);
}

export function characterHasRangedProficiency(character: Character): boolean {
  return character.proficiency.some(isRangedWeaponType);
}

export function wedgeSlotLabel(wedge: DemonWedge): string {
  return wedgeSlotLabelFromWedges(wedge);
}

export function wedgeCompatibleWithParent(
  wedge: DemonWedge,
  parent: CollectionEntry
): boolean {
  const category = getWedgeCategory(wedge);

  if (parent.type === "character") {
    const character = characters.find((c) => c.id === parent.itemId);
    if (!character) return false;

    if (category === "character") {
      return (
        wedge.restriction.includes("Characters") &&
        wedgeMatchesCharacter(wedge, character)
      );
    }
    if (category === "melee-consonance") {
      return (
        characterHasMeleeProficiency(character) &&
        wedgeMatchesCharacter(wedge, character)
      );
    }
    if (category === "ranged-consonance") {
      return (
        characterHasRangedProficiency(character) &&
        wedgeMatchesCharacter(wedge, character)
      );
    }
    return false;
  }

  if (parent.type === "weapon") {
    const weapon = weapons.find((w) => w.id === parent.itemId);
    if (!weapon) return false;

    if (category === "melee") {
      return (
        isMeleeWeaponType(weapon.type) &&
        wedgeMatchesWeapon(wedge, weapon, null)
      );
    }
    if (category === "ranged") {
      return (
        isRangedWeaponType(weapon.type) &&
        wedgeMatchesWeapon(wedge, weapon, null)
      );
    }
    return false;
  }

  return false;
}

export function resolveParentItem(parent: CollectionEntry): {
  name: string;
  kind: string;
} | null {
  if (parent.type === "character") {
    const character = characters.find((c) => c.id === parent.itemId);
    if (!character) return null;
    return { name: character.name, kind: "Character" };
  }
  if (parent.type === "weapon") {
    const weapon = weapons.find((w) => w.id === parent.itemId);
    if (!weapon) return null;
    return { name: weapon.name, kind: "Weapon" };
  }
  return null;
}

export function resolveParentById(parentId: string): {
  name: string;
  kind: string;
} | null {
  const colon = parentId.indexOf(":");
  if (colon === -1) return null;
  const type = parentId.slice(0, colon);
  const itemId = parentId.slice(colon + 1);
  if (type === "character") {
    const character = characters.find((c) => c.id === itemId);
    if (!character) return null;
    return { name: character.name, kind: "Character" };
  }
  if (type === "weapon") {
    const weapon = weapons.find((w) => w.id === itemId);
    if (!weapon) return null;
    return { name: weapon.name, kind: "Weapon" };
  }
  return null;
}
