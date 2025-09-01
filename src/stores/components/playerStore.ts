import { StateCreator } from "zustand";
import { GameState, PlayerCharacterState, CalculatedStats } from "../types/gameTypes";
import { Classes, PlayerCharacterEquipment } from "../../types";
import { ItemInstanceManager } from "../../utils/ItemInstanceManager";
import { eventBus } from "../../utils/EventBus";
import { experienceSystem } from "../../services/ExperienceSystem";
import { calculateEquipmentBonuses, calculateTotalStats } from "./equipmentStore";

const initialPlayerState: PlayerCharacterState = {
  health: 100,
  maxHealth: 100,
  lastAttackTime: 0,
  experience: 0,
  class: Classes.KNIGHT,
  equipment: {
    weapon: null,
    shield: null,
    trinket: null,
    helmet: null,
    amulet: null,
    armor: null,
  } as PlayerCharacterEquipment,
  inventory: [
    ItemInstanceManager.createItemInstance("sword1"),
    ItemInstanceManager.createItemInstance("greatSword", { power: 1 }),
    ItemInstanceManager.createItemInstance("woodenStaff"),
    ItemInstanceManager.createItemInstance("twigBow"),
    ItemInstanceManager.createItemInstance("boneClub"),
    ItemInstanceManager.createItemInstance("boneCharm"),
    ItemInstanceManager.createItemInstance("skullCap"),
    ItemInstanceManager.createItemInstance("skeletalMedallion"),
    ItemInstanceManager.createItemInstance("boneShield"),
    ItemInstanceManager.createItemInstance("skeletalArmor"),
    ItemInstanceManager.createFoodInstance("eggs", 5),
    ItemInstanceManager.createFoodInstance("chickenLegs", 3),
    ItemInstanceManager.createFoodInstance("dirtyFish", 2),
    ItemInstanceManager.createProductInstance("shinySkull", 2),
  ],
  skills: {
    playerLevel: { level: 1, experience: 0, maxExperience: 100 },
    meleeWeapons: { level: 1, experience: 0, maxExperience: 15 },
    archery: { level: 1, experience: 0, maxExperience: 15 },
    magic: { level: 1, experience: 0, maxExperience: 15 },
    shield: { level: 1, experience: 0, maxExperience: 20 },
  },
  gold: 0,
  questPoints: 0,
  maxCapacity: 40,
  currentCapacity: 10,
};

const initialCalculatedStats: CalculatedStats = {
  totalHealth: 100,
  totalMana: 100,
  totalPower: 1,
  totalArmor: 1,
  totalMoveSpeed: 250,
  totalAttackSpeed: 0,
  totalHealthRegen: 1,
  totalManaRegen: 2,
  equipmentBonuses: {
    health: 0,
    mana: 0,
    power: 0,
    armor: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    healthRegen: 0,
    manaRegen: 0,
    melee: 0,
  },
};

export interface PlayerStore {
  // State
  playerCharacter: PlayerCharacterState;
  calculatedStats: CalculatedStats;
  currentMap: string;

  // Player state methods
  updatePlayerMap: (mapKey: string) => void;
  updatePlayerHealth: (health: number) => void;
  updatePlayerMaxHealth: (maxHealth: number) => void;
  updatePlayerExperience: (experience: number) => void;
  updatePlayerLevel: (level: number) => void;
  updatePlayerGold: (amount: number, isAdditive?: boolean) => void;
  updatePlayerQuestPoints: (amount: number, isAdditive?: boolean) => void;
  getPlayerQuestPoints: () => number;

  // Experience methods
  awardExperience: (amount: number, x?: number, y?: number) => void;
  getPlayerLevelFromExperience: () => any;
  updatePlayerExperienceAndLevel: (newTotalExp: number) => void;
  registerExperienceSystem: () => void;
}

export const createPlayerStore: StateCreator<GameState & PlayerStore, [], [], PlayerStore> = (
  set,
  get
) => ({
  // Initial state
  playerCharacter: initialPlayerState,
  calculatedStats: initialCalculatedStats,
  currentMap: "game-map",

  // Map methods
  updatePlayerMap: (mapKey) => {
    set({ currentMap: mapKey });
    eventBus.emit("player.map.changed", mapKey);
  },

  // Player health methods
  updatePlayerHealth: (health) => {
    set((state) => ({
      playerCharacter: {
        ...state.playerCharacter,
        health,
      },
    }));
    eventBus.emit("playerCharacter.health.changed", health);
  },

  updatePlayerMaxHealth: (maxHealth) => {
    set((state) => ({
      playerCharacter: {
        ...state.playerCharacter,
        maxHealth,
      },
    }));
    eventBus.emit("playerCharacter.maxHealth.changed", maxHealth);
  },

  // Gold management
  updatePlayerGold: (goldValue: number, isAdditive: boolean = false) => {
    set((state) => {
      const newGold = isAdditive ? state.playerCharacter.gold + goldValue : goldValue;

      const updatedState = {
        playerCharacter: {
          ...state.playerCharacter,
          gold: Math.max(0, newGold),
        },
      };

      eventBus.emit("playerCharacter.gold.changed", updatedState.playerCharacter.gold);
      return updatedState;
    });
  },

  // Quest points management
  updatePlayerQuestPoints: (questPointValue: number, isAdditive: boolean = true) => {
    set((state) => {
      const newQuestPoints = isAdditive
        ? state.playerCharacter.questPoints + questPointValue
        : questPointValue;

      const updatedState = {
        playerCharacter: {
          ...state.playerCharacter,
          questPoints: Math.max(0, newQuestPoints),
        },
      };

      eventBus.emit(
        "playerCharacter.questPoints.changed",
        updatedState.playerCharacter.questPoints
      );
      return updatedState;
    });
  },

  getPlayerQuestPoints: () => {
    return get().playerCharacter.questPoints;
  },

  // Experience methods
  updatePlayerExperience: (experience) => {
    set((state) => {
      const newState = {
        playerCharacter: {
          ...state.playerCharacter,
          experience,
        },
      };

      // Calculate level from total experience using EXP_TABLE
      const levelData = experienceSystem.calculateLevelFromExperience(experience);

      // Update playerLevel skill to match calculated level
      const updatedSkills = {
        ...newState.playerCharacter.skills,
        playerLevel: {
          level: levelData.level,
          experience: levelData.currentExp,
          maxExperience: levelData.expForNextLevel,
        },
      };

      newState.playerCharacter.skills = updatedSkills;

      // Get equipment bonuses for stat calculation
      const equipmentBonuses = calculateEquipmentBonuses(newState.playerCharacter.equipment);
      const calculatedStats = calculateTotalStats(newState.playerCharacter, equipmentBonuses);

      eventBus.emit("playerCharacter.experience.changed", experience);
      eventBus.emit("playerCharacter.level.changed", levelData.level);
      eventBus.emit("player.stats.updated", calculatedStats);

      return {
        ...newState,
        calculatedStats,
      };
    });
  },

  awardExperience: (amount: number, x?: number, y?: number) => {
    experienceSystem.awardExperience(amount, x, y);
  },

  getPlayerLevelFromExperience: () => {
    const state = get();
    return experienceSystem.calculateLevelFromExperience(state.playerCharacter.experience);
  },

  updatePlayerExperienceAndLevel: (newTotalExp: number) => {
    const state = get();
    const oldLevelData = experienceSystem.calculateLevelFromExperience(
      state.playerCharacter.experience
    );
    const newLevelData = experienceSystem.calculateLevelFromExperience(newTotalExp);

    // Update experience
    get().updatePlayerExperience(newTotalExp);

    // Check for level up
    if (newLevelData.level > oldLevelData.level) {
      eventBus.emit("player.level.up", {
        oldLevel: oldLevelData.level,
        newLevel: newLevelData.level,
        totalExp: newTotalExp,
      });
    }
  },

  registerExperienceSystem: () => {
    set((state) => ({
      systems: {
        ...state.systems,
        experienceSystem,
      },
    }));
  },

  updatePlayerLevel: (level) => {
    set((state) => {
      const updatedSkills = {
        ...state.playerCharacter.skills,
        playerLevel: {
          ...state.playerCharacter.skills.playerLevel,
          level,
        },
      };

      const newState = {
        playerCharacter: {
          ...state.playerCharacter,
          skills: updatedSkills,
        },
      };

      eventBus.emit("playerCharacter.level.changed", level);

      return newState;
    });
  },
});
