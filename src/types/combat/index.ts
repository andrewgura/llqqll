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
  cooldown: number;
  damage: number;
  weaponType: string;
  requiredWeapon: string;
  skillId?: string;
  minSkillLevel?: number;
  range?: number;
  areaOfEffect?: boolean;
  areaSize?: number;
  // New property for animation type
  animationType: string;
  // Optional animation config
  animationConfig?: Record<string, any>;
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
