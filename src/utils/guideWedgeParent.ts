import { characters, weapons, wedges } from "../data";
import type { CollectionEntry } from "../types/collector";
import { collectionKey } from "../types/collector";
import { wedgeCompatibleWithParent } from "./wedgeCompat";
import type { ParsedGuideItem } from "./parseBuildGuide";
import type { ResolvedGuideItem } from "./guideResolve";

export interface GuideParentChoice {
  id: string;
  characterId: string;
  name: string;
  portrait: string;
  element: string;
  isSupport: boolean;
}

function makeCharacterParent(characterId: string): CollectionEntry {
  return {
    id: collectionKey("character", characterId),
    type: "character",
    itemId: characterId,
    target: 6,
    collected: false,
    addedAt: 0,
  };
}

function guideCharacters(resolved: ResolvedGuideItem[]): GuideParentChoice[] {
  const choices: GuideParentChoice[] = [];
  for (const item of resolved) {
    if (item.parsed.kind !== "character" && item.parsed.kind !== "support") continue;
    if (!item.selectedId) continue;
    const character = characters.find((c) => c.id === item.selectedId);
    if (!character) continue;
    choices.push({
      id: collectionKey("character", character.id),
      characterId: character.id,
      name: character.name,
      portrait: character.portrait,
      element: character.element,
      isSupport: item.parsed.kind === "support",
    });
  }
  return choices;
}

function compatibleParents(
  wedgeId: string,
  candidates: GuideParentChoice[],
  elementHint?: string,
  supportsOnly = false
): GuideParentChoice[] {
  const wedge = wedges.find((w) => w.id === wedgeId);
  if (!wedge) return [];

  let pool = supportsOnly ? candidates.filter((c) => c.isSupport) : candidates;
  pool = pool.filter((c) =>
    wedgeCompatibleWithParent(wedge, makeCharacterParent(c.characterId))
  );

  if (elementHint) {
    const hinted = pool.filter((c) => c.element === elementHint);
    if (hinted.length > 0) pool = hinted;
  }

  return pool;
}

function pickDefaultParent(choices: GuideParentChoice[]): GuideParentChoice | undefined {
  if (choices.length === 0) return undefined;
  const supports = choices.filter((c) => c.isSupport);
  return supports[0] ?? choices[0];
}

export function wedgeUsesSupportParent(parsed: ParsedGuideItem): boolean {
  return (
    parsed.wedgeParent === "support" ||
    parsed.section === "Support Wedges"
  );
}

export function resolveWedgeCharacterParent(
  item: ResolvedGuideItem,
  resolved: ResolvedGuideItem[]
): {
  parentId?: string;
  parentLabel?: string;
  parentChoices: GuideParentChoice[];
  parentMessage?: string;
} {
  if (!item.selectedId) {
    return { parentChoices: [] };
  }

  const wedge = wedges.find((w) => w.id === item.selectedId);
  if (!wedge) return { parentChoices: [] };

  const candidates = guideCharacters(resolved);
  const supportsOnly = wedgeUsesSupportParent(item.parsed);
  const choices = compatibleParents(
    item.selectedId,
    candidates,
    item.parsed.elementHint,
    supportsOnly
  );

  if (choices.length === 0) {
    const hint = item.parsed.elementHint;
    const who = supportsOnly ? "a support in this guide" : "a character in this guide";
    return {
      parentChoices: [],
      parentMessage: hint
        ? `No ${hint} ${who} can equip this wedge — exclude it or add a matching support`
        : `No ${who} can equip this wedge`,
    };
  }

  const picked = pickDefaultParent(choices);
  const needsChoice = choices.length > 1;

  return {
    parentId: picked?.id,
    parentLabel: picked?.name,
    parentChoices: needsChoice ? choices : [],
    parentMessage: needsChoice
      ? `Assign to a support — does not fit the main character`
      : supportsOnly
        ? `→ ${picked?.name} (support)`
        : undefined,
  };
}

export function buildWeaponParentMaps(resolved: ResolvedGuideItem[]) {
  const bySlot = new Map<"melee" | "ranged", string>();
  const byName = new Map<string, string>();

  for (const item of resolved) {
    if (item.parsed.kind !== "weapon" || !item.selectedId) continue;
    const parentKey = collectionKey("weapon", item.selectedId);
    if (item.parsed.slot) bySlot.set(item.parsed.slot, parentKey);
    const weapon = item.options.find((o) => o.id === item.selectedId);
    if (weapon) byName.set(weapon.name.toLowerCase(), parentKey);
  }

  return { bySlot, byName };
}

export function resolveWedgeWeaponParent(
  item: ResolvedGuideItem,
  weaponMaps: ReturnType<typeof buildWeaponParentMaps>
): string | undefined {
  if (item.parsed.weaponParentName) {
    return (
      weaponMaps.byName.get(item.parsed.weaponParentName.toLowerCase()) ??
      weaponMaps.bySlot.get("melee")
    );
  }
  return weaponMaps.bySlot.get("melee") ?? weaponMaps.bySlot.get("ranged");
}

export function enrichGuideParents(
  resolved: ResolvedGuideItem[],
  parentOverrides?: Map<string, string>
): ResolvedGuideItem[] {
  const main = resolved.find((r) => r.parsed.kind === "character" && r.selectedId);
  const mainParentId = main?.selectedId
    ? collectionKey("character", main.selectedId)
    : undefined;
  const weaponMaps = buildWeaponParentMaps(resolved);

  return resolved.map((item) => {
    if (item.parsed.kind !== "wedge" || item.status === "unresolved" || !item.selectedId) {
      return { ...item, parentChoices: undefined, parentId: undefined, parentLabel: undefined };
    }

    if (item.parsed.wedgeParent === "weapon") {
      const parentId = resolveWedgeWeaponParent(item, weaponMaps);
      const weapon = parentId
        ? weapons.find((w) => collectionKey("weapon", w.id) === parentId)
        : undefined;
      return {
        ...item,
        parentId,
        parentLabel: weapon?.name,
        parentChoices: undefined,
        parentMessage: parentId ? undefined : `Need weapon "${item.parsed.weaponParentName ?? "melee"}" first`,
      };
    }

    const override = parentOverrides?.get(item.parsed.id);
    if (override) {
      const choice = guideCharacters(resolved).find((c) => c.id === override);
      const allChoices = compatibleParents(
        item.selectedId,
        guideCharacters(resolved),
        item.parsed.elementHint,
        wedgeUsesSupportParent(item.parsed)
      );
      return {
        ...item,
        parentId: override,
        parentLabel: choice?.name,
        parentChoices: allChoices.length > 1 ? allChoices : undefined,
      };
    }

    const wedge = wedges.find((w) => w.id === item.selectedId);
    const mainFits =
      mainParentId &&
      wedge &&
      wedgeCompatibleWithParent(wedge, makeCharacterParent(main!.selectedId!));

    if (
      !wedgeUsesSupportParent(item.parsed) &&
      mainFits &&
      item.parsed.wedgeParent === "main"
    ) {
      const mainChar = characters.find((c) => c.id === main!.selectedId);
      return {
        ...item,
        parentId: mainParentId,
        parentLabel: mainChar?.name,
        parentChoices: undefined,
        parentMessage: undefined,
      };
    }

    const supportAssign = resolveWedgeCharacterParent(item, resolved);
    return {
      ...item,
      parentId: supportAssign.parentId,
      parentLabel: supportAssign.parentLabel,
      parentChoices: supportAssign.parentChoices,
      parentMessage: supportAssign.parentMessage ?? item.parentMessage,
    };
  });
}
