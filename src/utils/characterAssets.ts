const CHARACTER_ASSET_BASE =
  "https://files.boarhat.gg/assets/duetnightabyss/character/";

/** Full splash art from Boarhat character pages (e.g. margie_v1.png). */
export function getCharacterSplashUrl(portrait: string, target: string): string {
  const match = portrait.match(/\/character\/([^/]+)\.[Pp][Nn][Gg]/);
  const slug = match ? match[1].replace(/_v\d+$/i, "") : target;
  return `${CHARACTER_ASSET_BASE}${slug}_v1.png`;
}
