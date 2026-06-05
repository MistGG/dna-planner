/**
 * Fetches game data from Boarhat.gg's public JS bundles and writes JSON files.
 * Data source: https://boarhat.gg/games/duet-night-abyss/
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "data");

const PAGE_URLS = {
  characters:
    "https://boarhat.gg/games/duet-night-abyss/character/",
  weapons: "https://boarhat.gg/games/duet-night-abyss/weapon/",
  wedges: "https://boarhat.gg/games/duet-night-abyss/demon-wedge/",
};

const PAGE_BUNDLES = {
  characters: /character\.([A-Za-z0-9_-]+)\.js/,
  weapons: /weapons\.([A-Za-z0-9_-]+)\.js/,
  wedges: /demon-wedge\.([A-Za-z0-9_-]+)\.js/,
};

const DATA_IMPORTS = {
  characters: /charactersData\.([A-Za-z0-9_-]+)\.js/,
  weapons: /weaponsData\.([A-Za-z0-9_-]+)\.js/,
  wedges: /wedgesData\.([A-Za-z0-9_-]+)\.js/,
};

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "dna-planner/1.0" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function extractArray(jsContent) {
  const marker = "const e=";
  const start = jsContent.indexOf(marker);
  if (start === -1) throw new Error("Could not find data array in JS bundle");
  const arrayStart = start + marker.length;
  const arrayEnd = jsContent.lastIndexOf("];export");
  if (arrayEnd === -1) throw new Error("Could not find end of data array in JS bundle");
  const arrayStr = jsContent.slice(arrayStart, arrayEnd + 1);
  // Boarhat bundles use JS object syntax (unquoted keys), not strict JSON.
  return new Function(`return ${arrayStr}`)();
}

async function discoverBundleHashes() {
  const hashes = {};
  for (const [key, pageUrl] of Object.entries(PAGE_URLS)) {
    const html = await fetchText(pageUrl);
    const pageMatch = html.match(PAGE_BUNDLES[key]);
    if (!pageMatch) throw new Error(`Could not find ${key} page bundle on ${pageUrl}`);

    const pageBundleName =
      key === "wedges"
        ? `demon-wedge.${pageMatch[1]}.js`
        : key === "weapons"
          ? `weapons.${pageMatch[1]}.js`
          : `character.${pageMatch[1]}.js`;

    const pageJs = await fetchText(`https://boarhat.gg/_astro/${pageBundleName}`);
    const dataMatch = pageJs.match(DATA_IMPORTS[key]);
    if (!dataMatch) throw new Error(`Could not find ${key} data import in ${pageBundleName}`);
    hashes[key] = dataMatch[1];
  }
  return hashes;
}

async function main() {
  console.log("Discovering Boarhat data bundle hashes...");
  const hashes = await discoverBundleHashes();

  mkdirSync(OUT_DIR, { recursive: true });

  const meta = {
    version: "1.4",
    fetchedAt: new Date().toISOString(),
    source: "https://boarhat.gg/games/duet-night-abyss/",
    bundles: hashes,
  };

  for (const [key, hash] of Object.entries(hashes)) {
    const filePrefix =
      key === "characters" ? "characters" : key === "wedges" ? "wedges" : "weapons";
    const url = `https://boarhat.gg/_astro/${filePrefix}Data.${hash}.js`;
    console.log(`Fetching ${key}...`);
    const js = await fetchText(url);
    const data = extractArray(js);
    const outPath = join(OUT_DIR, `${key}.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`  → ${data.length} entries → ${outPath}`);
    meta[`${key}Count`] = data.length;
  }

  writeFileSync(join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
