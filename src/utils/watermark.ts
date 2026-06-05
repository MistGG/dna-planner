import { characters } from "../data";
import { ELEMENT_COLORS } from "../constants";
import { DNA_ASSETS } from "../theme/assets";
import type { CollectionEntry } from "../types/collector";
import { getCharacterSplashUrl } from "./characterAssets";

function lastAddedCharacter(queue: CollectionEntry[]) {
  return [...queue]
    .filter((e) => e.type === "character")
    .sort((a, b) => b.addedAt - a.addedAt)[0];
}

export function getWatermarkState(queue: CollectionEntry[]) {
  const entry = lastAddedCharacter(queue);
  if (entry) {
    const character = characters.find((c) => c.id === entry.itemId);
    if (character) {
      return {
        portrait: getCharacterSplashUrl(character.portrait, character.target),
        glow: ELEMENT_COLORS[character.element] ?? "#9d7ed8",
      };
    }
  }
  return {
    portrait: DNA_ASSETS.floraAbsolver,
    glow: "#9d7ed8",
  };
}
