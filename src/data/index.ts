import charactersJson from "./characters.json";
import weaponsJson from "./weapons.json";
import wedgesJson from "./wedges.json";
import metaJson from "./meta.json";
import type { Character, DemonWedge, Weapon } from "../types";

export const characters = charactersJson as unknown as Character[];
export const weapons = weaponsJson as unknown as Weapon[];
export const wedges = wedgesJson as unknown as DemonWedge[];
export const meta = metaJson;
