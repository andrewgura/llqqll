import { StateCreator } from "zustand";
import { eventBus } from "../../utils/EventBus";
import {
  SKILL_PROGRESSION,
  calculatePointsForNextLevel,
  calculateLevelFromExperience,
} from "../../utils/SkillProgressionFormula";
import { calculateEquipmentBonuses, calculateTotalStats } from "./equipmentStore";
import { GameState } from "@/types/game/state";

export interface SkillsStore {
  updateSkill: (skillId: string, newExperience: number) => void;
}

export const createSkillsStore: StateCreator<GameState & SkillsStore, [], [], SkillsStore> = (
  set,
  get
) => ({
  updateSkill: (skillId, newExperience) => {
    set((state) => {
      const skills = { ...state.playerCharacter.skills };

      if (!skills[skillId]) {
        const basePoints =
          SKILL_PROGRESSION.BASE_POINTS[skillId as keyof typeof SKILL_PROGRESSION.BASE_POINTS] ||
          15;

        skills[skillId] = {
          level: 1,
          experience: 0,
          maxExperience: basePoints,
        };
      }

      const skill = skills[skillId];
      const oldLevel = skill.level;

      if (skillId === "playerLevel") {
        skill.experience = newExperience;
        skill.maxExperience = calculatePointsForNextLevel(skillId, skill.level);
      } else {
        let totalExp = 0;
        for (let level = 1; level < skill.level; level++) {
          totalExp += calculatePointsForNextLevel(skillId, level);
        }
        totalExp += skill.experience;

        const newTotalExp = totalExp + (newExperience - skill.experience);
        const { level, currentExp, expForNextLevel } = calculateLevelFromExperience(
          skillId,
          newTotalExp
        );

        skill.level = level;
        skill.experience = currentExp;
        skill.maxExperience = expForNextLevel;
      }

      const newState = {
        playerCharacter: {
          ...state.playerCharacter,
          skills,
        },
      };

      // Recalculate stats after skill change
      const equipmentBonuses = calculateEquipmentBonuses(state.playerCharacter.equipment);
      const calculatedStats = calculateTotalStats(newState.playerCharacter, equipmentBonuses);

      eventBus.emit("playerCharacter.skill.updated", {
        skillId,
        level: skill.level,
        experience: skill.experience,
        maxExperience: skill.maxExperience,
        leveledUp: skill.level > oldLevel,
      });

      if (skillId === "playerLevel" && skill.level !== oldLevel) {
        eventBus.emit("playerCharacter.level.changed", skill.level);
      }

      eventBus.emit("player.stats.updated", calculatedStats);

      return {
        ...newState,
        calculatedStats,
      };
    });
  },
});
