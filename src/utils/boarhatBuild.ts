import { inflate } from "pako";
import { characters, weapons, wedges } from "../data";
import { collectionKey } from "../types/collector";
import type { ParsedGuide, ParsedGuideItem } from "./parseBuildGuide";
import type { GuideMatchOption, ResolvedGuideItem } from "./guideResolve";
import {
  wedgeDisplayName,
  wedgeElementLabel,
  wedgeMetaDetail,
  wedgeSlotLabel,
} from "./wedges";

export interface BoarhatWedgeSlot {
  id: string;
  t: string;
  f: string;
}

export interface BoarhatBuild {
  c: string | null;
  sm: string | null;
  sr: string | null;
  smw: (BoarhatWedgeSlot | null)[];
  srw: (BoarhatWedgeSlot | null)[];
  sw: (BoarhatWedgeSlot | null)[];
  scw: (BoarhatWedgeSlot | null)[];
  sg: string | null;
  a: { c: string | null; w: string | null }[];
}

let itemCounter = 0;
function nextId() {
  itemCounter += 1;
  return `boarhat-${itemCounter}`;
}

export function extractBuildParam(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http")) {
      return new URL(trimmed).searchParams.get("build");
    }
  } catch {
    /* treat as raw param */
  }
  return trimmed;
}

export function decodeBoarhatBuild(param: string): BoarhatBuild | null {
  try {
    const base64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const json = inflate(bytes, { to: "string" });
    return JSON.parse(json) as BoarhatBuild;
  } catch {
    return null;
  }
}

function countWedgeSlots(slots: (BoarhatWedgeSlot | null)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slot of slots) {
    if (!slot?.id) continue;
    counts.set(slot.id, (counts.get(slot.id) ?? 0) + 1);
  }
  return counts;
}

function addWedgeItems(
  items: ParsedGuideItem[],
  counts: Map<string, number>,
  section: string,
  wedgeParent: "main" | "weapon",
  parentWeaponId?: string
) {
  for (const [wedgeId, quantity] of counts) {
    items.push({
      id: nextId(),
      kind: "wedge",
      label: wedgeId,
      alternatives: [wedgeId],
      quantity,
      intronTarget: 1,
      wedgeParent,
      parentWeaponId,
      section,
    });
  }
}

export function boarhatBuildToParsedGuide(build: BoarhatBuild): ParsedGuide {
  itemCounter = 0;
  const items: ParsedGuideItem[] = [];
  const warnings: string[] = [];

  if (build.c) {
    const character = characters.find((c) => c.id === build.c);
    items.push({
      id: nextId(),
      kind: "character",
      label: character?.name ?? `Character #${build.c}`,
      alternatives: [build.c],
      quantity: 1,
      intronTarget: 6,
      section: "Main Character",
    });
  }

  if (build.sm) {
    const weapon = weapons.find((w) => w.id === build.sm);
    items.push({
      id: nextId(),
      kind: "weapon",
      label: weapon?.name ?? `Melee weapon #${build.sm}`,
      alternatives: [build.sm],
      quantity: 1,
      intronTarget: 1,
      slot: "melee",
      section: "Melee Weapon",
    });
  }

  if (build.sr) {
    const weapon = weapons.find((w) => w.id === build.sr);
    items.push({
      id: nextId(),
      kind: "weapon",
      label: weapon?.name ?? `Ranged weapon #${build.sr}`,
      alternatives: [build.sr],
      quantity: 1,
      intronTarget: 1,
      slot: "ranged",
      section: "Ranged Weapon",
    });
  }

  if (build.c) {
    const charWedges = new Map<string, number>();
    for (const [id, qty] of countWedgeSlots(build.sw)) {
      charWedges.set(id, (charWedges.get(id) ?? 0) + qty);
    }
    for (const [id, qty] of countWedgeSlots(build.scw)) {
      charWedges.set(id, (charWedges.get(id) ?? 0) + qty);
    }
    addWedgeItems(items, charWedges, "Character Wedges", "main");
  }

  if (build.sm) {
    addWedgeItems(
      items,
      countWedgeSlots(build.smw),
      "Melee Weapon Wedges",
      "weapon",
      build.sm
    );
  }

  if (build.sr) {
    addWedgeItems(
      items,
      countWedgeSlots(build.srw),
      "Ranged Weapon Wedges",
      "weapon",
      build.sr
    );
  }

  build.a.forEach((ally, index) => {
    if (ally.c) {
      const character = characters.find((c) => c.id === ally.c);
      items.push({
        id: nextId(),
        kind: "support",
        label: character?.name ?? `Ally #${index + 1}`,
        alternatives: [ally.c],
        quantity: 1,
        intronTarget: 6,
        section: `Ally ${index + 1}`,
      });
    }
    if (ally.w) {
      const weapon = weapons.find((w) => w.id === ally.w);
      items.push({
        id: nextId(),
        kind: "weapon",
        label: weapon?.name ?? `Ally weapon #${index + 1}`,
        alternatives: [ally.w],
        quantity: 1,
        intronTarget: 1,
        section: `Ally ${index + 1} Weapon`,
        note: "Ally weapon",
      });
    }
  });

  if (build.sg) {
    warnings.push("Geniemon is in this build but not tracked in DNA Collector yet.");
  }

  const mainName = characters.find((c) => c.id === build.c)?.name ?? "Boarhat Build";

  return {
    title: `${mainName} — Boarhat Build`,
    mainCharacter: mainName,
    items,
    warnings,
  };
}

function toOption(
  kind: ParsedGuideItem["kind"],
  id: string
): GuideMatchOption | null {
  if (kind === "character" || kind === "support") {
    const c = characters.find((x) => x.id === id);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      type: "character",
      portrait: c.portrait,
      detail: `${c.element} · ${c.role}`,
    };
  }
  if (kind === "weapon") {
    const w = weapons.find((x) => x.id === id);
    if (!w) return null;
    return {
      id: w.id,
      name: w.name,
      type: "weapon",
      portrait: w.portrait,
      detail: `${w.type} · ${w.element}`,
    };
  }
  const wedge = wedges.find((x) => x.id === id);
  if (!wedge) return null;
  return {
    id: wedge.id,
    name: wedgeDisplayName(wedge),
    type: "wedge",
    portrait: wedge.portrait,
    rarity: wedge.rarity,
    slotLabel: wedgeSlotLabel(wedge),
    element: wedgeElementLabel(wedge),
    detail: wedgeMetaDetail(wedge),
  };
}

/** Resolve Boarhat items by exact database id (no fuzzy matching). */
export function resolveBoarhatItems(items: ParsedGuideItem[]): ResolvedGuideItem[] {
  return items.map((parsed) => {
    const id = parsed.alternatives[0];
    const option = toOption(parsed.kind, id);
    if (!option) {
      return {
        parsed,
        status: "unresolved",
        options: [],
        message: `ID ${id} not found in local data — try running npm run fetch-data`,
      };
    }
    return {
      parsed,
      status: "resolved",
      options: [option],
      selectedId: option.id,
    };
  });
}

export function parseBoarhatBuildUrl(input: string): {
  guide: ParsedGuide;
  resolved: ResolvedGuideItem[];
} | null {
  const param = extractBuildParam(input);
  if (!param) return null;
  const build = decodeBoarhatBuild(param);
  if (!build) return null;
  const guide = boarhatBuildToParsedGuide(build);
  return { guide, resolved: resolveBoarhatItems(guide.items) };
}

export function wedgeParentIdForItem(
  item: ParsedGuideItem,
  mainParentId?: string
): string | undefined {
  if (item.kind !== "wedge") return undefined;
  if (item.parentWeaponId) return collectionKey("weapon", item.parentWeaponId);
  if (item.wedgeParent === "main") return mainParentId;
  return undefined;
}
