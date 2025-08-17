import { eventBus } from "../utils/EventBus";
import { useGameStore } from "../stores/gameStore";
import { SKILL_PROGRESSION } from "../utils/SkillProgressionFormula";
import { DamageEvent } from "../types";

class SkillProgressionSystemService {
  private readonly WEAPON_SKILL_MAP: Record<string, string> = {
    melee: "meleeWeapons",
    archery: "archery",
    magic: "magic",
  };

  constructor() {
    this.initialize();
  }

  initialize(): void {
    // Subscribe to damage events
    eventBus.on("damage.dealt", this.handleDamageDealt.bind(this));
  }

  /**
   * Handles damage dealt events to award skill points
   */
  handleDamageDealt(event?: DamageEvent): void {
    try {
      // Skip processing if no data or invalid data
      if (!event) {
        return;
      }

      // Determine which skill to update based on weapon type
      const skillId = this.WEAPON_SKILL_MAP[event.weaponType];

      if (!skillId) {
        return;
      }

      // Award skill points for each successful hit
      const pointsToAward = this.calculatePointsToAward(event);

      // Award skill points to the appropriate weapon skill
      this.awardSkillPoints(skillId, pointsToAward);
    } catch (error) {
      console.error("Error in handleDamageDealt:", error);
    }
  }

  /**
   * Calculate points to award based on damage event
   */
  private calculatePointsToAward(event: DamageEvent): number {
    let basePoints = 1;

    // Extra points for ability usage vs auto attack
    if (event.source === "ability") {
      basePoints += 1;
    }

    // Scale points with damage (slightly)
    const damageBonus = Math.floor(event.damage / 10);

    return basePoints + damageBonus;
  }

  /**
   * Awards skill points to a specific skill using the formula-based system
   */
  awardSkillPoints(skillId: string, points: number): void {
    try {
      const store = useGameStore.getState();

      // Get current skill or initialize if not found
      let currentSkill = store.playerCharacter.skills[skillId];

      if (!currentSkill) {
        const basePoints =
          SKILL_PROGRESSION.BASE_POINTS[skillId as keyof typeof SKILL_PROGRESSION.BASE_POINTS] ||
          15;
        currentSkill = {
          level: 1,
          experience: 0,
          maxExperience: basePoints,
        };
      }

      const oldExperience = currentSkill.experience;
      const newExperience = oldExperience + points;

      // Simply add the points - updateSkill handles the level calculations
      store.updateSkill(skillId, newExperience);
    } catch (error) {
      console.error("Error in awardSkillPoints:", error);
    }
  }

  /**
   * Direct method to add skill points to a specific skill
   */
  addSkillPoints(skillId: string, points: number): void {
    this.awardSkillPoints(skillId, points);
  }

  dispose(): void {
    // Clean up event listeners
    eventBus.off("damage.dealt", this.handleDamageDealt);
  }
}

// Create and export singleton instance
export const skillProgressionSystem = new SkillProgressionSystemService();
