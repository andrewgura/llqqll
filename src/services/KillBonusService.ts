import { useGameStore } from "@/stores/gameStore";

export interface KillBonusData {
  damageBonus: number;
  damageReduction: number;
  lootBonus: number;
}

/**
 * Service to calculate kill bonuses based on player's kill count for specific monsters
 */
export class KillBonusService {
  /**
   * Get accumulated bonuses for a specific monster type based on kill count
   */
  static getKillBonuses(monsterId: string): KillBonusData {
    const store = useGameStore.getState();
    const killCount = store.getCreatureKillCount(monsterId);

    let damageBonus = 0;
    let damageReduction = 0;
    let lootBonus = 0;

    // Apply bonuses based on milestones reached
    // 250 kills: 1% Bonus Damage
    if (killCount >= 250) {
      damageBonus += 5;
    }

    // 500 kills: 1% Damage Reduction
    if (killCount >= 500) {
      damageReduction += 5;
    }

    // 1000 kills: 2% Bonus Damage & Reduction (additional)
    if (killCount >= 1000) {
      damageBonus += 5; // Total 3% at this point
      damageReduction += 5; // Total 3% at this point
    }

    // 1250 kills: 1% Better Loot Chance
    if (killCount >= 1250) {
      lootBonus += 4;
    }

    return {
      damageBonus,
      damageReduction,
      lootBonus,
    };
  }

  /**
   * Apply damage bonus to outgoing damage
   */
  static applyDamageBonus(baseDamage: number, targetMonsterId: string): number {
    const bonuses = this.getKillBonuses(targetMonsterId);
    const multiplier = 1 + bonuses.damageBonus / 100;
    return Math.round(baseDamage * multiplier);
  }

  /**
   * Apply damage reduction bonus to incoming damage
   */
  static applyDamageReduction(incomingDamage: number, attackerMonsterId: string): number {
    const bonuses = this.getKillBonuses(attackerMonsterId);
    const reductionMultiplier = bonuses.damageReduction / 100;
    const reducedDamage = incomingDamage * (1 - reductionMultiplier);
    return Math.max(1, Math.round(reducedDamage)); // Always deal at least 1 damage
  }

  /**
   * Apply loot bonus to drop chance
   */
  static applyLootBonus(baseChance: number, monsterId: string): number {
    const bonuses = this.getKillBonuses(monsterId);
    const bonusMultiplier = 1 + bonuses.lootBonus / 100;
    return Math.min(1, baseChance * bonusMultiplier); // Cap at 100% chance
  }

  /**
   * Get a summary of active bonuses for display purposes
   */
  static getBonusSummary(monsterId: string): string[] {
    const bonuses = this.getKillBonuses(monsterId);
    const summary: string[] = [];

    if (bonuses.damageBonus > 0) {
      summary.push(`+${bonuses.damageBonus}% damage vs ${monsterId}`);
    }

    if (bonuses.damageReduction > 0) {
      summary.push(`-${bonuses.damageReduction}% damage from ${monsterId}`);
    }

    if (bonuses.lootBonus > 0) {
      summary.push(`+${bonuses.lootBonus}% loot chance from ${monsterId}`);
    }

    return summary;
  }
}
