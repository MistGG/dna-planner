/** Clean wedge names from build guides before matching game data. */
export function cleanGuideWedgeName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Expand shorthand guide names to fuller search phrases. */
export function expandWedgeQueries(cleaned: string): string[] {
  const n = normalize(cleaned.replace(/-/g, " "));
  const queries = new Set<string>([cleaned, cleaned.replace(/-/g, " ")]);

  if (/wings.*inspo.*morale/.test(n)) {
    queries.add("Siren's Wings Inspo - Morale");
    queries.add("Siren's Wings Inspo Morale");
  }
  if (/wings.*inspo.*volition/.test(n)) {
    queries.add("Siren's Wings Inspo Volition");
  }

  const blazeMatch = n.match(/^blaze\s+(morale|volition|inspo)$/);
  if (blazeMatch) {
    queries.add(`Covenanter's Blaze ${blazeMatch[1]}`);
  }

  const primeMatch = n.match(/^prime\s+(\w+)$/);
  if (primeMatch) {
    queries.add(`Typhon's Prime ${primeMatch[1]}`);
  }

  if (/griffin.*thunder.*wildfire/.test(n)) {
    queries.add("Griffin's Thunder");
    queries.add("Griffin's Thunder Wildfire");
  }
  if (/ravaging thunder/.test(n)) {
    queries.add("Summanus's Ravaging Thunder");
  }
  if (/feathered serpent.*volition/.test(n)) {
    queries.add("Feathered Serpent's Volition");
  }
  if (/^rage\s+trammel$/.test(n)) {
    queries.add("Cerberus's Rage Trammel");
  }
  if (/^edge\s+trammel$/.test(n)) {
    queries.add("Cerberus's Edge Trammel");
  }
  if (/^trammel$/.test(n)) {
    queries.add("Cerberus's Trammel");
  }
  if (/continuity\s+trammel/.test(n)) {
    queries.add("Fenrir's Continuity Trammel");
  }
  if (/^surge$/.test(n)) {
    queries.add("Surge");
  }
  if (/frosty torrent/.test(n)) {
    queries.add("Bahamut's Frosty Torrent");
    queries.add("Frosty Torrent");
  }
  if (/^serenity$/.test(n) || /prime serenity/.test(n)) {
    queries.add("Typhon's Prime Serenity");
  }
  if (/^uplift$/.test(n) || /prime uplift/.test(n)) {
    queries.add("Typhon's Prime Uplift");
  }
  if (/^surge$/.test(n)) {
    queries.add("Sphinx's Surge");
  }

  return [...queries];
}
