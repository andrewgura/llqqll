// ============================================================================
// KILL BONUS CONFIGURATION
// ============================================================================

export interface KillBonusMilestone {
  killCount: number;
  bonusDamage?: number; // Percentage bonus damage (e.g., 1 = 1%)
  damageReduction?: number; // Percentage damage reduction (e.g., 1 = 1%)
  lootChance?: number; // Percentage better loot chance (e.g., 1 = 1%)
  reward: string; // Display text for UI
}

/**
 * Configurable kill bonus milestones for all creatures
 * These values can be easily adjusted for game balance
 */
export const KILL_BONUS_MILESTONES: KillBonusMilestone[] = [
  {
    killCount: 1,
    bonusDamage: 2000,
    reward: "+1% Bonus Damage",
  },
  {
    killCount: 500,
    damageReduction: 1,
    reward: "+1% Damage Reduction",
  },
  {
    killCount: 1000,
    bonusDamage: 2,
    damageReduction: 2,
    reward: "+2% Bonus Damage & Reduction",
  },
  {
    killCount: 1250,
    lootChance: 1,
    reward: "+1% Better Loot Chance",
  },
];

/**
 * Calculate total bonuses from kill count
 */
export class KillBonusCalculator {
  /**
   * Get total damage bonus percentage for a creature kill count
   */
  static getDamageBonus(killCount: number): number {
    return KILL_BONUS_MILESTONES.filter(
      (milestone) => killCount >= milestone.killCount && milestone.bonusDamage
    ).reduce((total, milestone) => total + (milestone.bonusDamage || 0), 0);
  }

  /**
   * Get total damage reduction percentage for a creature kill count
   */
  static getDamageReductionBonus(killCount: number): number {
    return KILL_BONUS_MILESTONES.filter(
      (milestone) => killCount >= milestone.killCount && milestone.damageReduction
    ).reduce((total, milestone) => total + (milestone.damageReduction || 0), 0);
  }

  /**
   * Get total loot chance bonus percentage for a creature kill count
   */
  static getLootChanceBonus(killCount: number): number {
    return KILL_BONUS_MILESTONES.filter(
      (milestone) => killCount >= milestone.killCount && milestone.lootChance
    ).reduce((total, milestone) => total + (milestone.lootChance || 0), 0);
  }

  /**
   * Get milestones with completion status for UI display
   */
  static getMilestonesWithProgress(killCount: number) {
    return KILL_BONUS_MILESTONES.map((milestone) => ({
      ...milestone,
      completed: killCount >= milestone.killCount,
    }));
  }
}
