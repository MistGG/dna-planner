import { characters, weapons, wedges } from "../data";
import type { Character, DemonWedge, Weapon } from "../types";
import type { CollectionEntry } from "../types/collector";
import { collectionKey } from "../types/collector";
import { wedgeCompatibleWithParent } from "./wedgeCompat";
import { filterWedgeList } from "./filters";
import { cleanGuideWedgeName, expandWedgeQueries } from "./guideWedgeNames";
import type { GuideParentChoice } from "./guideWedgeParent";
import type { ParsedGuideItem } from "./parseBuildGuide";
import {
  wedgeDisplayName,
  wedgeElementLabel,
  wedgeMetaDetail,
  wedgeSlotLabel,
} from "./wedges";

export interface GuideMatchOption {
  id: string;
  name: string;
  type: "character" | "weapon" | "wedge";
  portrait: string;
  detail?: string;
  /** Wedge rarity for accent color only, e.g. "4★" */
  rarity?: string;
  slotLabel?: string;
  element?: string;
}

export interface ResolvedGuideItem {
  parsed: ParsedGuideItem;
  status: "resolved" | "choice" | "unresolved" | "skipped";
  options: GuideMatchOption[];
  selectedId?: string;
  message?: string;
  /** Collection key for wedge parent (character or weapon). */
  parentId?: string;
  parentLabel?: string;
  parentChoices?: GuideParentChoice[];
  parentMessage?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

function scoreName(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  const qc = compact(query);
  const cc = compact(candidate);
  if (q === c || qc === cc) return 100;
  if (c.includes(q) || q.includes(c) || cc.includes(qc) || qc.includes(cc)) return 80;
  const qParts = q.split(" ").filter(Boolean);
  if (qParts.length > 0 && qParts.every((p) => c.includes(p))) return 70;
  return 0;
}

function findCharacters(query: string): Character[] {
  const scored = characters
    .map((c) => ({
      c,
      score: Math.max(scoreName(query, c.name), scoreName(query, c.target)),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.c);
}

function findWeapons(query: string): Weapon[] {
  const scored = weapons
    .map((w) => ({ w, score: scoreName(query, w.name) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.w);
}

function wedgeLabel(w: DemonWedge): string {
  return wedgeDisplayName(w);
}

/** Name after possessive prefix, e.g. "Bahamut's Frosty Torrent" → "frosty torrent". */
function wedgeNameSuffix(w: DemonWedge): string {
  const parts = normalize(w.name).split(" ").filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join(" ");
  return normalize(w.name);
}

function scoreWedge(w: DemonWedge, queries: string[]): number {
  const full = normalize(wedgeLabel(w));
  const name = normalize(w.name);
  const sub = normalize(w.subname);
  const suffix = wedgeNameSuffix(w);
  let best = 0;
  for (const query of queries) {
    const q = normalize(query);
    best = Math.max(best, scoreName(query, wedgeLabel(w)));
    if (full.includes(q) || suffix.includes(q) || name.includes(q)) best = Math.max(best, 78);
    if (q.length >= 4 && (suffix === q || suffix.endsWith(` ${q}`) || suffix.startsWith(`${q} `))) {
      best = Math.max(best, 88);
    }
    const parts = q.split(" ").filter(Boolean);
    if (parts.length > 0 && parts.every((p) => full.includes(p) || name.includes(p) || sub.includes(p) || suffix.includes(p))) {
      best = Math.max(best, 76);
    }
    if (parts.length >= 2) {
      const [first, ...rest] = parts;
      if (name.includes(first) && rest.every((p) => sub.includes(p) || full.includes(p) || suffix.includes(p))) {
        best = Math.max(best, 82);
      }
      if (suffix === parts.join(" ") || parts.every((p) => suffix.includes(p))) {
        best = Math.max(best, 86);
      }
    }
  }
  return best;
}

function dedupeWedges(list: DemonWedge[]): DemonWedge[] {
  const seen = new Set<string>();
  return list.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
}

function filterByElementHint(list: DemonWedge[], elementHint?: string): DemonWedge[] {
  if (!elementHint) return list;
  const filtered = list.filter((w) => w.restriction.includes(elementHint));
  return filtered.length > 0 ? filtered : list;
}

function findWedgesByName(rawQuery: string, elementHint?: string): DemonWedge[] {
  const cleaned = cleanGuideWedgeName(rawQuery);
  const queries = expandWedgeQueries(cleaned);

  const scored = wedges
    .map((w) => ({ w, score: scoreWedge(w, queries) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return dedupeWedges(filterByElementHint(scored.map((x) => x.w), elementHint));
}

function findWedges(
  rawQuery: string,
  parent?: CollectionEntry,
  elementHint?: string,
  strictParent = true
): DemonWedge[] {
  let results = findWedgesByName(rawQuery, elementHint);

  if (parent) {
    const compatible = results.filter((w) => wedgeCompatibleWithParent(w, parent));
    if (compatible.length > 0) {
      results = compatible;
    } else if (strictParent) {
      results = [];
    }
  }

  return results;
}

function toOption(
  type: "character" | "weapon" | "wedge",
  entity: Character | Weapon | DemonWedge
): GuideMatchOption {
  if (type === "character") {
    const c = entity as Character;
    return {
      id: c.id,
      name: c.name,
      type,
      portrait: c.portrait,
      detail: `${c.element} · ${c.role}`,
    };
  }
  if (type === "weapon") {
    const w = entity as Weapon;
    return {
      id: w.id,
      name: w.name,
      type,
      portrait: w.portrait,
      detail: `${w.type} · ${w.element}`,
    };
  }
  const wedge = entity as DemonWedge;
  return {
    id: wedge.id,
    name: wedgeLabel(wedge),
    type,
    portrait: wedge.portrait,
    rarity: wedge.rarity,
    slotLabel: wedgeSlotLabel(wedge),
    element: wedgeElementLabel(wedge),
    detail: wedgeMetaDetail(wedge),
  };
}

function resolveAlternatives(
  parsed: ParsedGuideItem,
  finder: (name: string) => GuideMatchOption[]
): ResolvedGuideItem {
  if (parsed.alternatives.length > 1) {
    const optionSets = parsed.alternatives.map((alt) => finder(alt));
    const merged = new Map<string, GuideMatchOption>();
    for (const set of optionSets) {
      for (const opt of set) merged.set(opt.id, opt);
    }
    const options = [...merged.values()];
    if (options.length === 0) {
      return {
        parsed,
        status: "unresolved",
        options: [],
        message: `Could not match: ${parsed.alternatives.join(" / ")}`,
      };
    }
    if (options.length === 1) {
      return { parsed, status: "resolved", options, selectedId: options[0].id };
    }
    return {
      parsed,
      status: "choice",
      options,
      message: `Pick one: ${parsed.alternatives.join(" / ")}`,
    };
  }

  const cleaned = cleanGuideWedgeName(parsed.alternatives[0]);
  const options = finder(cleaned);
  if (options.length === 0) {
    return {
      parsed,
      status: "unresolved",
      options: [],
      message: `Could not match: ${parsed.label}`,
    };
  }
  if (options.length === 1) {
    return { parsed, status: "resolved", options, selectedId: options[0].id };
  }
  return {
    parsed,
    status: "choice",
    options,
    message: `Multiple matches for "${parsed.label}" — pick the one for your build`,
  };
}

function makeParent(
  type: "character" | "weapon",
  itemId: string
): CollectionEntry {
  return {
    id: collectionKey(type, itemId),
    type,
    itemId,
    target: type === "character" ? 6 : 1,
    collected: false,
    addedAt: 0,
  };
}

function buildWeaponLookup(resolved: ResolvedGuideItem[]) {
  const bySlot = new Map<"melee" | "ranged", string>();
  const byName = new Map<string, string>();

  for (const item of resolved) {
    if (item.parsed.kind !== "weapon" || !item.selectedId) continue;
    if (item.parsed.slot) bySlot.set(item.parsed.slot, item.selectedId);
    const weapon = weapons.find((w) => w.id === item.selectedId);
    if (weapon) byName.set(normalize(weapon.name), item.selectedId);
    for (const alt of item.parsed.alternatives) {
      for (const match of findWeapons(alt)) {
        byName.set(normalize(match.name), item.selectedId);
      }
    }
  }

  return { bySlot, byName };
}

function wedgeParentFor(
  parsed: ParsedGuideItem,
  mainParent: CollectionEntry | undefined,
  weaponLookup: ReturnType<typeof buildWeaponLookup>
): CollectionEntry | undefined {
  if (parsed.wedgeParent === "main") return mainParent;

  let weaponId: string | undefined;
  if (parsed.weaponParentName) {
    weaponId =
      findWeapons(parsed.weaponParentName)[0]?.id ??
      weaponLookup.byName.get(normalize(parsed.weaponParentName));
  }
  weaponId ??= weaponLookup.bySlot.get("melee");
  if (!weaponId) return undefined;
  return makeParent("weapon", weaponId);
}

export function resolveGuideItems(
  items: ParsedGuideItem[],
  mainCharacterId?: string
): ResolvedGuideItem[] {
  const mainParent = mainCharacterId
    ? makeParent("character", mainCharacterId)
    : undefined;

  const nonWedges = items.filter((i) => i.kind !== "wedge");
  const wedgeItems = items.filter((i) => i.kind === "wedge");

  const resolvedNonWedges = nonWedges.map((parsed) => {
    if (parsed.kind === "character" || parsed.kind === "support") {
      return resolveAlternatives(parsed, (name) =>
        findCharacters(name).map((c) => toOption("character", c))
      );
    }
    return resolveAlternatives(parsed, (name) =>
      findWeapons(name).map((w) => toOption("weapon", w))
    );
  });

  const mainId =
    resolvedNonWedges.find((r) => r.parsed.kind === "character")?.selectedId ??
    mainCharacterId;
  const effectiveMainParent = mainId ? makeParent("character", mainId) : mainParent;
  const weaponLookup = buildWeaponLookup(resolvedNonWedges);

  const supportParents = resolvedNonWedges
    .filter((r) => r.parsed.kind === "support" && r.selectedId)
    .map((r) => makeParent("character", r.selectedId!));

  const resolvedWedges = wedgeItems.map((parsed) => {
    if (parsed.wedgeParent === "support") {
      return resolveAlternatives(parsed, (name) => {
        const matches = findWedgesByName(name, parsed.elementHint);
        const compatible =
          supportParents.length > 0
            ? matches.filter((w) =>
                supportParents.some((p) => wedgeCompatibleWithParent(w, p))
              )
            : matches;
        const options = (compatible.length > 0 ? compatible : matches).map((w) =>
          toOption("wedge", w)
        );
        return options;
      });
    }

    const parent = wedgeParentFor(parsed, effectiveMainParent, weaponLookup);
    if (parsed.kind === "wedge" && !parent && parsed.wedgeParent === "weapon") {
      return {
        parsed,
        status: "unresolved" as const,
        options: [],
        message: `Need weapon "${parsed.weaponParentName ?? "melee"}" on the list first`,
      };
    }
    return resolveAlternatives(parsed, (name) =>
      findWedges(name, parent, parsed.elementHint, true).map((w) => toOption("wedge", w))
    );
  });

  const result: ResolvedGuideItem[] = [];
  for (const parsed of items) {
    if (parsed.kind === "wedge") {
      result.push(resolvedWedges.find((r) => r.parsed.id === parsed.id)!);
    } else {
      result.push(resolvedNonWedges.find((r) => r.parsed.id === parsed.id)!);
    }
  }
  return result;
}

export function isGuideItemImportable(
  item: ResolvedGuideItem,
  excludedIds?: Set<string>
): boolean {
  if (excludedIds?.has(item.parsed.id)) return false;
  if (item.status === "skipped" || item.status === "unresolved") return false;
  if (!item.selectedId) return false;
  if (item.parsed.kind === "wedge" && !item.parentId) return false;
  return true;
}

export function canImportGuide(
  resolved: ResolvedGuideItem[],
  excludedIds?: Set<string>
): boolean {
  return resolved.some((item) => isGuideItemImportable(item, excludedIds));
}

export function importableGuideCount(
  resolved: ResolvedGuideItem[],
  excludedIds?: Set<string>
): number {
  return resolved.filter((item) => isGuideItemImportable(item, excludedIds)).length;
}

export function guideWedgeOption(wedgeId: string): GuideMatchOption | null {
  const wedge = wedges.find((w) => w.id === wedgeId);
  if (!wedge) return null;
  return toOption("wedge", wedge);
}

export function searchGuideWedgeOptions(query: string, limit = 16): GuideMatchOption[] {
  if (!query.trim()) return [];
  return filterWedgeList(wedges, {
    search: query,
    rarity: "",
    polarity: "",
    restriction: "",
    source: "",
  })
    .slice(0, limit)
    .map((w) => toOption("wedge", w));
}

export function mergeGuideItemSelection(
  item: ResolvedGuideItem,
  option: GuideMatchOption
): ResolvedGuideItem {
  const options = item.options.some((o) => o.id === option.id)
    ? item.options
    : [...item.options, option];
  return {
    ...item,
    options,
    selectedId: option.id,
    status: "resolved",
  };
}

export function guideItemNeedsManualWedgeSearch(
  item: ResolvedGuideItem,
  importable: boolean,
  excluded: boolean
): boolean {
  if (excluded || item.parsed.kind !== "wedge") return false;
  if (item.status === "unresolved") return true;
  if (!importable) return true;
  return item.status === "choice";
}

export function guideItemCanUndoChoice(item: ResolvedGuideItem): boolean {
  return (
    item.status === "resolved" &&
    !!item.selectedId &&
    item.options.length > 1
  );
}
