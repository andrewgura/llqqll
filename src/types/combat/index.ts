/**
 * Combat and ability system types
 */

/**
 * Ability/skill definition
 */
export interface Ability {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number; // in seconds
  damage: number;
  healing?: number; // Add healing property for abilities like Light Healing
  weaponType: string; // "melee", "archery", "magic", "general" (for learned abilities)
  requiredWeapon: string; // specific weapon ID or "any"
  skillId: string; // skill category this ability belongs to
  range?: number; // range in pixels
  areaSize?: number; // area of effect size
  duration?: number; // for buffs/debuffs
  animationType: string;
  animationConfig?: any;

  // Requirements
  minLevel?: number;
  requiredItems?: string[]; // item IDs required to use

  // Additional properties
  isChanneled?: boolean;
  canBeInterrupted?: boolean;
  isInstant?: boolean;
}
/**
 * Damage event data for skill progression tracking
 */
export interface DamageEvent {
  source: string; // 'autoAttack' or 'ability'
  abilityId?: string; // Only present for ability damage
  weaponType: string; // 'melee', 'archery', or 'magic'
  targetType: string; // 'monster'
  targetId: string; // monster type
  damage: number;
}

export enum DamageType {
  PHYSICAL = "physyical",
  FIRE = "fire",
  ICE = "ice",
  ENERGY = "energy",
  POISON = "poison",
}
