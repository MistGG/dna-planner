export type GuideDisplayBlock =
  | { type: "title"; text: string }
  | { type: "section"; text: string }
  | { type: "subsection"; text: string }
  | { type: "item"; text: string }
  | { type: "quote"; text: string }
  | { type: "bold"; text: string }
  | { type: "text"; text: string };

const SECTION_HEADERS = new Set([
  "weapons",
  "weapon",
  "wedges",
  "wedge",
  "supports",
  "support",
  "character",
  "melee",
  "ranged",
  "range",
]);

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[:.]+$/g, "").trim();
}

/** Turn pasted guide markdown into display blocks. */
export function parseGuideDisplayBlocks(text: string): GuideDisplayBlock[] {
  const blocks: GuideDisplayBlock[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const backtick = line.match(/^`([^`]+)`$/);
    if (backtick) {
      const content = backtick[1].trim();
      const header = normalizeHeader(content);

      if (/build\s*guide/i.test(content) && blocks.length === 0) {
        blocks.push({ type: "title", text: content });
        continue;
      }

      if (/^weapons?$/.test(header)) {
        blocks.push({ type: "section", text: "Weapons" });
        continue;
      }
      if (/^wedges?$/.test(header)) {
        blocks.push({ type: "section", text: "Wedges" });
        continue;
      }
      if (/^supports?$/.test(header)) {
        blocks.push({ type: "section", text: "Supports" });
        continue;
      }
      if (/^character$/i.test(content)) {
        blocks.push({ type: "subsection", text: "Character" });
        continue;
      }
      if (/^melee weapon/i.test(content)) {
        blocks.push({ type: "subsection", text: content });
        continue;
      }
      if (/^(melee|range[d]?)\s*-/i.test(content)) {
        blocks.push({ type: "item", text: content });
        continue;
      }
      if (/^\d+x\s*-/i.test(content) || /^-/.test(content)) {
        blocks.push({ type: "item", text: content });
        continue;
      }

      blocks.push({ type: "item", text: content });
      continue;
    }

    if (line.startsWith(">")) {
      blocks.push({ type: "quote", text: line.replace(/^>\s*/, "") });
      continue;
    }

    const bold = line.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      blocks.push({ type: "bold", text: bold[1].trim() });
      continue;
    }

    if (SECTION_HEADERS.has(normalizeHeader(line))) {
      blocks.push({ type: "subsection", text: line });
      continue;
    }

    blocks.push({ type: "text", text: line });
  }

  return blocks;
}

export function groupEntriesBySection<T extends { section: string }>(
  entries: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const list = map.get(entry.section) ?? [];
    list.push(entry);
    map.set(entry.section, list);
  }
  return map;
}

const SECTION_ORDER = [
  "Build",
  "Main Character",
  "Weapons",
  "Wedges",
  "Weapon Wedges",
  "Supports",
  "Support Wedges",
  "Support Weapons",
];

export function sortSectionKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
