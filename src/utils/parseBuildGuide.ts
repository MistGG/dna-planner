import { ELEMENTS } from "../constants";

export type GuideItemKind = "character" | "weapon" | "wedge" | "support";

export interface ParsedGuideItem {
  id: string;
  kind: GuideItemKind;
  label: string;
  alternatives: string[];
  quantity: number;
  intronTarget: number;
  slot?: "melee" | "ranged";
  wedgeParent?: "main" | "weapon" | "support";
  /** From guide text like "(Hydro limited)" — used to pick wedge variant and parent */
  elementHint?: string;
  /** When wedges belong to a specific weapon, e.g. Eternal Farewell */
  weaponParentName?: string;
  /** Boarhat builds — exact weapon id for wedge parent */
  parentWeaponId?: string;
  section: string;
  note?: string;
}

export interface ParsedGuide {
  title: string;
  mainCharacter: string;
  items: ParsedGuideItem[];
  warnings: string[];
}

let itemCounter = 0;
function nextId() {
  itemCounter += 1;
  return `guide-item-${itemCounter}`;
}

function parseBacktickLine(line: string): string | null {
  const match = line.trim().match(/^`([^`]+)`$/);
  return match ? match[1].trim() : null;
}

/** Normalize section headers like "Wedges:" or "Weapons:" */
function normalizeSectionHeader(value: string): string {
  return value.toLowerCase().replace(/[:.]+$/g, "").trim();
}

function cleanWedgeName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuantityLine(content: string): { quantity: number; name: string } | null {
  const match = content.match(/^(\d+)x\s*-\s*(.+)$/i);
  if (!match) return null;
  return {
    quantity: parseInt(match[1], 10),
    name: cleanWedgeName(match[2]),
  };
}

function extractTitleCharacter(text: string): { title: string; mainCharacter: string } {
  const match = text.match(/`([^`]+)`/);
  const title = match?.[1]?.trim() ?? "Build Guide";
  const mainCharacter = title
    .replace(/\s*build\s*guide.*$/i, "")
    .replace(/\s*guide\s*[\d.]+.*$/i, "")
    .trim();
  return { title, mainCharacter };
}

function extractSupportNames(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  const aliases: [RegExp, string][] = [
    [/\btruffle\b/i, "Truffle and Filbert"],
    [/\bfina\b/i, "Fina"],
    [/\bfushu\b/i, "Fushu"],
    [/\brhythm\b/i, "Rhythm"],
    [/\btabethe\b/i, "Tabethe"],
    [/\byuming\b/i, "Yuming"],
  ];

  for (const [pattern, name] of aliases) {
    if (pattern.test(lower)) found.add(name);
  }

  return [...found];
}

function parseElementHint(raw: string): string | undefined {
  const match = raw.match(/\(([^)]*)\)/);
  if (!match) return undefined;
  const inner = match[1].toLowerCase();
  return ELEMENTS.find((el) => inner.includes(el.toLowerCase()));
}

function parseNotableLine(content: string): { name: string; elementHint?: string } | null {
  const stripped = content.replace(/^-\s*/, "");
  const elementHint = parseElementHint(stripped);
  const cleaned = cleanWedgeName(stripped);
  return cleaned ? { name: cleaned, elementHint } : null;
}

function parseWeaponWedgeLine(content: string): string | null {
  return cleanWedgeName(content.replace(/^-+\s*/, ""));
}

export function parseBuildGuide(text: string): ParsedGuide {
  itemCounter = 0;
  const { title, mainCharacter } = extractTitleCharacter(text);
  const lines = text.split("\n");
  const items: ParsedGuideItem[] = [];
  const warnings: string[] = [];

  let section = "";
  let wedgeTarget: "main" | "weapon" = "main";
  let weaponParentName: string | undefined;

  if (mainCharacter) {
    items.push({
      id: nextId(),
      kind: "character",
      label: mainCharacter,
      alternatives: [mainCharacter],
      quantity: 1,
      intronTarget: 6,
      section: "Build",
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const backtick = parseBacktickLine(line);

    if (backtick) {
      const header = normalizeSectionHeader(backtick);
      if (/^weapons?$/.test(header)) {
        section = "weapons";
        continue;
      }
      if (/^wedges?$/.test(header)) {
        section = "wedges";
        wedgeTarget = "main";
        weaponParentName = undefined;
        continue;
      }
      if (/^supports?$/.test(header)) {
        section = "supports";
        continue;
      }

      if (section === "weapons") {
        const weaponMatch = backtick.match(/^(Melee|Range[d]?)\s*-\s*(.+)$/i);
        if (weaponMatch) {
          const slot = weaponMatch[1].toLowerCase().startsWith("m") ? "melee" : "ranged";
          const alternatives = weaponMatch[2].split("/").map((s) => s.trim()).filter(Boolean);
          items.push({
            id: nextId(),
            kind: "weapon",
            label: `${slot} weapon`,
            alternatives,
            quantity: 1,
            intronTarget: 1,
            slot,
            wedgeParent: "weapon",
            section: "Weapons",
          });
        }
        continue;
      }

      if (section === "wedges") {
        const meleeWeaponSection = backtick.match(/^Melee Weapon\s*\((.+)\)$/i);
        if (meleeWeaponSection) {
          wedgeTarget = "weapon";
          weaponParentName = meleeWeaponSection[1].trim();
          continue;
        }

        if (/^character$/i.test(backtick)) {
          wedgeTarget = "main";
          weaponParentName = undefined;
          continue;
        }
        if (/^melee/i.test(backtick)) {
          wedgeTarget = "weapon";
          continue;
        }
        if (/^range/i.test(backtick)) {
          wedgeTarget = "weapon";
          continue;
        }

        const dashWedge = parseWeaponWedgeLine(backtick);
        if (wedgeTarget === "weapon" && /^-/.test(backtick) && dashWedge) {
          items.push({
            id: nextId(),
            kind: "wedge",
            label: dashWedge,
            alternatives: [dashWedge],
            quantity: 1,
            intronTarget: 1,
            wedgeParent: "weapon",
            weaponParentName,
            section: "Weapon Wedges",
          });
          continue;
        }

        const qty = parseQuantityLine(backtick);
        if (qty) {
          if (/signature wedge/i.test(qty.name)) {
            warnings.push(`Skipped "${qty.name}" — add manually if needed.`);
            continue;
          }
          items.push({
            id: nextId(),
            kind: "wedge",
            label: qty.name,
            alternatives: [qty.name],
            quantity: qty.quantity,
            intronTarget: 1,
            wedgeParent: wedgeTarget,
            weaponParentName: wedgeTarget === "weapon" ? weaponParentName : undefined,
            section: "Wedges",
          });
        }
        continue;
      }

      if (section === "supports" && backtick.startsWith("-")) {
        const notable = parseNotableLine(backtick);
        if (!notable) continue;
        const { name, elementHint } = notable;
        if (
          /wedge/i.test(name) ||
          /serenity|uplift|surge|torrent|morale|volition|inspo/i.test(name)
        ) {
          items.push({
            id: nextId(),
            kind: "wedge",
            label: name,
            alternatives: [name],
            quantity: 1,
            intronTarget: 1,
            wedgeParent: "support",
            elementHint,
            section: "Support Wedges",
            note: elementHint
              ? `Support wedge — assign to a ${elementHint} character`
              : "Support wedge — assign to a support character after import",
          });
          continue;
        }
        items.push({
          id: nextId(),
          kind: "weapon",
          label: name,
          alternatives: [name],
          quantity: 1,
          intronTarget: 1,
          section: "Support Weapons",
          note: "Support weapon",
        });
      }
    }

    if (section === "supports" && line.startsWith(">")) {
      for (const name of extractSupportNames(line)) {
        if (items.some((i) => i.kind === "support" && i.alternatives[0] === name)) continue;
        items.push({
          id: nextId(),
          kind: "support",
          label: name,
          alternatives: [name],
          quantity: 1,
          intronTarget: 6,
          section: "Supports",
        });
      }
    }
  }

  return { title, mainCharacter, items, warnings };
}
