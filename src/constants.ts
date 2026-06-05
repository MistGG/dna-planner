export const ELEMENTS = [
  "Pyro",
  "Anemo",
  "Hydro",
  "Lumino",
  "Electro",
  "Umbro",
  "Neutral",
] as const;

export const ELEMENT_COLORS: Record<string, string> = {
  Pyro: "#ff6b4a",
  Anemo: "#5ee4a0",
  Hydro: "#4ab8ff",
  Lumino: "#f5d76e",
  Electro: "#b87aff",
  Umbro: "#8b7cf6",
  Neutral: "#9ca3af",
};

export const WEAPON_TYPES = [
  "Sword",
  "Dual Pistols",
  "Whipsword",
  "Assault Rifle",
  "Greatsword",
  "Grenade Launcher",
  "Dual Blades",
  "Katana",
  "Pistol",
  "Polearm",
  "Shotgun",
  "Bow",
] as const;

export const MELEE_WEAPON_TYPES = [
  "Sword",
  "Whipsword",
  "Greatsword",
  "Dual Blades",
  "Katana",
  "Polearm",
] as const;

export const RANGED_WEAPON_TYPES = [
  "Dual Pistols",
  "Assault Rifle",
  "Grenade Launcher",
  "Pistol",
  "Shotgun",
  "Bow",
] as const;

export const ATTACK_TYPES = ["Slash", "Spike", "Smash", "Calamity"] as const;

export const WEDGE_RARITIES = ["2★", "3★", "4★", "5★"] as const;

/** In-game wedge rarity colors — 2★ blue, 4★ purple, 5★ gold */
export const WEDGE_RARITY_LABELS: Record<string, string> = {
  "2★": "Blue",
  "3★": "Silver",
  "4★": "Purple",
  "5★": "Gold",
};

export const WEDGE_POLARITIES = ["◬", "◊", "☽", "⊙"] as const;
