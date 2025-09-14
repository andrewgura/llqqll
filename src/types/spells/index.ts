/**
 * Spell system types
 */

/**
 * Spell categories for organizing spells into sections
 */
export enum SpellCategory {
  GENERAL = "general",
  WARRIOR = "warrior",
  MAGE = "mage",
  RANGER = "ranger",
}

/**
 * Spell target types
 */
export enum SpellTargetType {
  SELF = "self",
  TARGET = "target",
  AREA = "area",
  GROUND = "ground",
}

/**
 * Animation configuration for spell effects
 */
export interface SpellAnimationConfig {
  effectDuration?: number;
  particleColors?: number[];
  targetSelf?: boolean;
  projectileSpeed?: number;
  explosionRadius?: number;
  expansionTime?: number;
  ringWidth?: number;
  startRadius?: number;
  endRadius?: number;
  wallLength?: number;
  wallWidth?: number;
  lineWidth?: number;
  arcAngle?: number;
  particleCount?: number;
  gridSize?: number;
}

/**
 * Core spell data structure
 */
export interface SpellData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SpellCategory;

  // Costs and cooldowns
  cooldown: number; // in seconds
  manaCost: number;

  // Effects
  healing?: number;
  damage?: number;
  range?: number;
  areaSize?: number;
  duration?: number; // for buffs/debuffs

  // Requirements
  minLevel?: number;
  requiredItems?: string[]; // item IDs required to cast

  // Animation and visual effects
  animationType: string;
  animationConfig?: SpellAnimationConfig;

  // Targeting
  targetType?: SpellTargetType;

  // Additional properties
  isChanneled?: boolean;
  canBeInterrupted?: boolean;
  isInstant?: boolean;
}

/**
 * Learned spells state for the game store
 */
export interface SpellState {
  learnedSpells: string[]; // Array of spell IDs
  spellCooldowns: Record<string, number>; // spell ID -> timestamp when cooldown expires
}

/**
 * Spell categories display information
 */
export interface SpellCategoryInfo {
  id: SpellCategory;
  name: string;
  description: string;
  icon?: string;
}

/**
 * Spell learning event data
 */
export interface SpellLearnedEvent {
  spellId: string;
  spellName: string;
  category: SpellCategory;
}

/**
 * Spell cast event data
 */
export interface SpellCastEvent {
  spellId: string;
  casterId: string;
  targetX?: number;
  targetY?: number;
  targetId?: string;
}
