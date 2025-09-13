/**
 * Monster system types
 */

/**
 * Monster categories for organization
 */
export enum MonsterCategory {
  DARK_ELF = "dark_elf",
  UNDEAD = "undead",
  BEAST = "beast",
  ELEMENTAL = "elemental",
  HUMAN = "human",
  DEMON = "demon",
}

/**
 * Monster attack types
 */
export enum MonsterAttackType {
  Melee = "melee",
  Ranged = "ranged",
  Magic = "magic",
}

/**
 * Item drop configuration for monsters
 */
export interface ItemDrop {
  itemId: string;
  chance: number; // 0-1, representing drop chance percentage
  minQuantity?: number; // Minimum quantity to drop (default 1)
  maxQuantity?: number; // Maximum quantity to drop (default 1)
}

/**
 * Monster template data structure
 */
export interface MonsterData {
  id: string;
  name: string;
  category?: MonsterCategory; // Monster category for organization
  sprite: string;
  health: number;
  maxHealth: number;
  preview: string;
  speed: number;
  experience: number; // Experience awarded when defeated
  damage?: number; // Base damage
  armor: number;
  drops: ItemDrop[]; // Array of possible item drops
  abilities?: string[]; // IDs of abilities this monster can use
  isAggressive?: boolean; // Whether the monster is aggressive by default
  attackType?: MonsterAttackType; // "melee", "ranged", or "magic"
  runawayPercent?: number; // Health percentage at which monster tries to run away
  description?: string; // Monster description/lore
  spriteSize?: 32 | 64;
  scale?: number;
  color?: number;
  isRare?: boolean;
  isBoss?: boolean;
  extraHitBox?: number;
}

/**
 * Monster death event data
 */
export interface MonsterDeathEvent {
  type: string;
  name: string;
  x: number;
  y: number;
  experience: number;
}
