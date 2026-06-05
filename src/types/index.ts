export interface Character {
  id: string;
  name: string;
  target: string;
  portrait: string;
  element: string;
  role: string;
  proficiency: string[];
  feature: string[];
  tier: { Farming: string; Boss: string };
  released: boolean;
  baseStats?: Record<string, unknown>;
  baseWeapon?: {
    name: string;
    type: string;
    attackType: string;
    stats: Record<string, string>;
  };
}

export interface Weapon {
  id: string;
  name: string;
  portrait: string;
  type: string;
  element: string;
  attackType: string;
  skill: string;
  stats: Record<string, string>;
  attribute?: Record<string, string>;
  baseBuff?: Record<string, number[]>;
  smelt?: Record<number, string[]>;
}

export interface DemonWedge {
  id: string;
  name: string;
  subname: string;
  portrait: string;
  tolerance: string;
  polarity: string;
  track: string;
  rarity: string;
  mainEffect: string[];
  subEffect: string[];
  restriction: string[];
  sourceLevel: string[];
  trammel?: boolean;
}

export type WedgeCategory =
  | "character"
  | "melee"
  | "ranged"
  | "melee-consonance"
  | "ranged-consonance";
