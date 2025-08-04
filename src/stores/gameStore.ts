import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  PlayerCharacterEquipment,
  ItemInstance,
  ItemBonusStats,
  SetCollectionData,
  Quest,
} from "../types";

import { ItemInstanceManager } from "../utils/ItemInstanceManager";
import { ItemDictionary } from "../services/ItemDictionaryService";
import { eventBus } from "../utils/EventBus";
import {
  SKILL_PROGRESSION,
  calculatePointsForNextLevel,
  calculateLevelFromExperience,
} from "@/utils/SkillProgressionFormula";
import { questService } from "@/services/QuestService";
import { experienceSystem } from "@/services/ExperienceSystem";

export interface CalculatedStats {
  // Total stats including base + equipment + skills
  totalHealth: number;
  totalMana: number;
  totalPower: number;
  totalArmor: number;
  totalMoveSpeed: number; // SIMPLIFIED: Single move speed value (base 250)
  totalAttackSpeed: number;
  totalHealthRegen: number;
  totalManaRegen: number;

  // Equipment bonuses only
  equipmentBonuses: {
    health: number;
    mana: number;
    power: number;
    armor: number;
    moveSpeed: number;
    attackSpeed: number;
    healthRegen: number;
    manaRegen: number;
    melee: number;
  };
}

// Define the store state structure
export interface GameState {
  // Player properties
  playerCharacter: {
    health: number;
    maxHealth: number;
    lastAttackTime: number;
    experience: number;
    equipment: PlayerCharacterEquipment;
    inventory: ItemInstance[];
    skills: {
      [key: string]: {
        level: number;
        experience: number;
        maxExperience: number;
      };
    };
    gold: number;
    maxCapacity: number;
    currentCapacity: number;
    teleportPosition?: { x: number; y: number };
  };

  // Calculated stats
  calculatedStats: CalculatedStats;

  // Game state
  quests: {
    active: Quest[];
    completed: Quest[];
  };

  // UI state
  inputFocused: boolean;

  // Collection state
  setCollections: SetCollectionData;

  // Map state
  currentMap: string;

  // System references
  systems?: Record<string, any>;

  // Methods
  registerSystem: (name: string, system: any) => void;
  updatePlayerMap: (mapKey: string) => void;
  updatePlayerHealth: (health: number) => void;
  updatePlayerMaxHealth: (maxHealth: number) => void;
  updatePlayerExperience: (experience: number) => void;
  updatePlayerLevel: (level: number) => void;
  setPlayerCharacterEquipment: (equipment: PlayerCharacterEquipment, source?: string) => void;
  setInputFocused: (focused: boolean) => void;
  updateSetCollections: (collections: SetCollectionData) => void;
  updateSkill: (skillId: string, newExperience: number) => void;
  getItemInstanceById: (instanceId: string) => ItemInstance | undefined;
  addItemInstanceToInventory: (itemInstance: ItemInstance) => boolean;
  removeItemInstanceFromInventory: (instanceId: string, quantity?: number) => boolean;
  updatePlayerGold: (amount: number, isAdditive?: boolean) => void;
  updatePlayerMaxCapacity: (amount: number) => void;
  updatePlayerCurrentCapacity: (amount: number) => void;
  recalculateStats: () => void;
  acceptQuest: (questId: string) => void;
  updateQuestProgress: (monsterId: string) => void;
  initializeQuestSystem: () => void;
  awardExperience: (amount: number, x?: number, y?: number) => void;
  getPlayerLevelFromExperience: () => {
    level: number;
    currentExp: number;
    expForNextLevel: number;
  };
  updatePlayerExperienceAndLevel: (newTotalExp: number) => void;
}

// Helper functions for calculating stats
const calculateEquipmentBonuses = (equipment: PlayerCharacterEquipment) => {
  const bonuses = {
    health: 0,
    mana: 0,
    power: 0,
    armor: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    healthRegen: 0,
    manaRegen: 0,
    capacity: 0,
    melee: 0,
  };

  // Track equipped sets for set bonuses
  const equippedSets: Record<string, ItemInstance[]> = {};

  Object.values(equipment).forEach((itemInstance) => {
    if (!itemInstance) return;

    // Get combined stats (base + bonuses) - this already includes bonusStats
    const itemData = ItemInstanceManager.getCombinedStats(itemInstance);
    if (itemData) {
      bonuses.power += itemData.power || 0;
      bonuses.armor += itemData.armor || 0;
      bonuses.healthRegen += itemData.hpRegen || 0;
      bonuses.manaRegen += itemData.mpRegen || 0;
      bonuses.health += itemData.health || 0;
      bonuses.mana += itemData.mana || 0;
      bonuses.moveSpeed += itemData.moveSpeed || 0;
      bonuses.attackSpeed += itemData.attackSpeed || 0;
      bonuses.capacity += itemData.capacity || 0;
      bonuses.melee += itemData.melee || 0;

      // Track sets - store the actual item instances
      if (itemData.set) {
        if (!equippedSets[itemData.set]) {
          equippedSets[itemData.set] = [];
        }
        equippedSets[itemData.set].push(itemInstance);
      }
    }
  });

  // Apply set bonuses for sets with 2+ pieces
  Object.entries(equippedSets).forEach(([setName, items]) => {
    if (items.length >= 2) {
      // Apply set bonus from each equipped set piece
      items.forEach((item) => {
        const itemData = ItemInstanceManager.getCombinedStats(item);
        if (itemData?.setBonus) {
          bonuses.power += itemData.setBonus.power || 0;
          bonuses.armor += itemData.setBonus.armor || 0;
          bonuses.health += itemData.setBonus.health || 0;
          bonuses.mana += itemData.setBonus.mana || 0;
          bonuses.moveSpeed += itemData.setBonus.moveSpeed || 0;
          bonuses.attackSpeed += itemData.setBonus.attackSpeed || 0;
          bonuses.healthRegen += itemData.setBonus.healthRegen || 0;
          bonuses.manaRegen += itemData.setBonus.manaRegen || 0;
          bonuses.capacity += itemData.setBonus.capacity || 0;
          bonuses.melee += itemData.setBonus.melee || 0;
        }
      });
    }
  });

  return bonuses;
};

// Calculate total stats including base, equipment, and skills
const calculateTotalStats = (playerCharacter: any, equipmentBonuses: any): CalculatedStats => {
  const skills = playerCharacter.skills;

  // Base stats
  const baseHealth = 100;
  const baseMana = 100;
  const basePower = 1;
  const baseArmor = 1;
  const baseMoveSpeed = 250;
  const baseAttackSpeed = 0;
  const baseHealthRegen = 1;
  const baseManaRegen = 2;

  // Skill bonuses (simplified)
  const skillHealthBonus = skills.health?.level || 0;
  const skillManaBonus = skills.mana?.level || 0;
  const skillPowerBonus = skills.power?.level || 0;
  const skillArmorBonus = skills.armor?.level || 0;
  const skillMoveSpeedBonus = skills.moveSpeed?.level || 0;
  const skillAttackSpeedBonus = skills.attackSpeed?.level || 0;
  const skillHealthRegenBonus = skills.healthRegen?.level || 0;
  const skillManaRegenBonus = skills.manaRegen?.level || 0;

  return {
    totalHealth: baseHealth + skillHealthBonus + equipmentBonuses.health,
    totalMana: baseMana + skillManaBonus + equipmentBonuses.mana,
    totalPower: basePower + skillPowerBonus + equipmentBonuses.power,
    totalArmor: baseArmor + skillArmorBonus + equipmentBonuses.armor,
    totalMoveSpeed: baseMoveSpeed + skillMoveSpeedBonus + equipmentBonuses.moveSpeed,
    totalAttackSpeed: baseAttackSpeed + skillAttackSpeedBonus + equipmentBonuses.attackSpeed,
    totalHealthRegen: baseHealthRegen + skillHealthRegenBonus + equipmentBonuses.healthRegen,
    totalManaRegen: baseManaRegen + skillManaRegenBonus + equipmentBonuses.manaRegen,
    equipmentBonuses,
  };
};

const initialCalculatedStats = {
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

// Initial state
const initialState = {
  playerCharacter: {
    health: 100,
    maxHealth: 100,
    lastAttackTime: 0,
    experience: 0,
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
      // Main combat skills
      playerLevel: { level: 1, experience: 0, maxExperience: 100 },
      meleeWeapons: { level: 1, experience: 0, maxExperience: 15 },
      archery: { level: 1, experience: 0, maxExperience: 15 },
      magic: { level: 1, experience: 0, maxExperience: 15 },
      shield: { level: 1, experience: 0, maxExperience: 20 },
    },
    gold: 100,
    maxCapacity: 40,
    currentCapacity: 10,
  },
  calculatedStats: initialCalculatedStats,
  quests: {
    active: [],
    completed: [],
  },
  inputFocused: false,
  setCollections: {},
  currentMap: "game-map",
  systems: {},
};

// Create the store
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Register a system
    registerSystem: (name, system) => {
      set((state) => ({
        systems: {
          ...state.systems,
          [name]: system,
        },
      }));
    },

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

        // Recalculate stats
        const equipmentBonuses = calculateEquipmentBonuses(state.playerCharacter.equipment);
        const calculatedStats = calculateTotalStats(newState.playerCharacter, equipmentBonuses);

        eventBus.emit("playerCharacter.level.changed", level);
        eventBus.emit("player.stats.updated", calculatedStats);

        return {
          ...newState,
          calculatedStats,
        };
      });
    },

    // SIMPLIFIED: Equipment - handles ItemInstance with simplified move speed events
    setPlayerCharacterEquipment: (equipment, source = "system") => {
      set((state) => {
        const newState = {
          playerCharacter: {
            ...state.playerCharacter,
            equipment,
          },
        };

        // Recalculate stats after equipment change
        const equipmentBonuses = calculateEquipmentBonuses(equipment);
        const calculatedStats = calculateTotalStats(newState.playerCharacter, equipmentBonuses);

        eventBus.emit("equipment.changed", { equipment, source });
        eventBus.emit("player.stats.updated", calculatedStats);
        // SIMPLIFIED: Single move speed event
        eventBus.emit("player.moveSpeed.updated", calculatedStats.totalMoveSpeed);

        return {
          ...newState,
          calculatedStats,
        };
      });
    },

    // Input focus
    setInputFocused: (inputFocused) => {
      set({ inputFocused });
      eventBus.emit("input.focused", inputFocused);
    },

    // Set collections
    updateSetCollections: (setCollections) => {
      set({ setCollections });
      eventBus.emit("setCollections.updated", setCollections);
    },

    // Skills
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

    // Inventory methods with stacking support
    getItemInstanceById: (instanceId) => {
      const state = get();

      const inventoryItem = state.playerCharacter.inventory.find(
        (item) => item.instanceId === instanceId
      );
      if (inventoryItem) return inventoryItem;

      const equipment = state.playerCharacter.equipment;
      for (const slotItem of Object.values(equipment)) {
        if (slotItem && slotItem.instanceId === instanceId) {
          return slotItem;
        }
      }

      return undefined;
    },

    addItemInstanceToInventory: (itemInstance) => {
      const state = get();
      const itemData = ItemDictionary.getItem(itemInstance.templateId);

      if (itemData?.stackable) {
        const existingItemIndex = state.playerCharacter.inventory.findIndex(
          (item) => item.templateId === itemInstance.templateId
        );

        if (existingItemIndex !== -1) {
          const newInventory = [...state.playerCharacter.inventory];
          const existingItem = newInventory[existingItemIndex];
          const currentQuantity = existingItem.quantity || 1;
          const addingQuantity = itemInstance.quantity || 1;

          newInventory[existingItemIndex] = {
            ...existingItem,
            quantity: currentQuantity + addingQuantity,
          };

          set((state) => ({
            playerCharacter: {
              ...state.playerCharacter,
              inventory: newInventory,
            },
          }));

          eventBus.emit("inventory.updated", null);
          return true;
        }
      }

      const newItem = {
        ...itemInstance,
        quantity: itemInstance.quantity || 1,
      };

      set((state) => ({
        playerCharacter: {
          ...state.playerCharacter,
          inventory: [...state.playerCharacter.inventory, newItem],
        },
      }));

      eventBus.emit("inventory.updated", null);
      return true;
    },

    removeItemInstanceFromInventory: (instanceId, quantity = 1) => {
      const state = get();
      const inventory = [...state.playerCharacter.inventory];
      const itemIndex = inventory.findIndex((item) => item.instanceId === instanceId);

      if (itemIndex === -1) return false;

      const item = inventory[itemIndex];
      const currentQuantity = item.quantity || 1;

      if (currentQuantity <= quantity) {
        inventory.splice(itemIndex, 1);
      } else {
        inventory[itemIndex] = {
          ...item,
          quantity: currentQuantity - quantity,
        };
      }

      set((state) => ({
        playerCharacter: {
          ...state.playerCharacter,
          inventory,
        },
      }));

      eventBus.emit("inventory.updated", null);
      return true;
    },

    // Player stats
    updatePlayerGold: (goldValue: number, isAdditive: boolean = false) => {
      set((state) => {
        const newGold = isAdditive
          ? Math.max(0, state.playerCharacter.gold + goldValue)
          : Math.max(0, goldValue);

        return {
          playerCharacter: {
            ...state.playerCharacter,
            gold: newGold,
          },
        };
      });

      const currentGold = get().playerCharacter.gold;
      eventBus.emit("playerCharacter.gold.changed", currentGold);
    },

    updatePlayerMaxCapacity: (amount) => {
      set((state) => ({
        playerCharacter: {
          ...state.playerCharacter,
          maxCapacity: Math.max(0, state.playerCharacter.maxCapacity + amount),
        },
      }));
    },

    updatePlayerCurrentCapacity: (amount) => {
      set((state) => ({
        playerCharacter: {
          ...state.playerCharacter,
          currentCapacity: Math.max(0, state.playerCharacter.currentCapacity + amount),
        },
      }));
    },

    // SIMPLIFIED: Recalculate stats manually with simplified move speed events
    recalculateStats: () => {
      set((state) => {
        const equipmentBonuses = calculateEquipmentBonuses(state.playerCharacter.equipment);
        const calculatedStats = calculateTotalStats(state.playerCharacter, equipmentBonuses);

        eventBus.emit("player.stats.updated", calculatedStats);
        // SIMPLIFIED: Single move speed event
        eventBus.emit("player.moveSpeed.updated", calculatedStats.totalMoveSpeed);

        return {
          calculatedStats,
        };
      });
    },

    // Quest methods
    acceptQuest: (questId) => {
      const quest = questService.createQuestFromDefinition(questId);
      if (!quest) {
        console.error(`Quest definition not found: ${questId}`);
        return;
      }

      set((state) => {
        // Check if quest is already active
        const isAlreadyActive = state.quests.active.some((q) => q.id === questId);
        if (isAlreadyActive) {
          return state;
        }

        const newActiveQuests = [...state.quests.active, quest];

        eventBus.emit("quest.accepted", quest);

        return {
          quests: {
            ...state.quests,
            active: newActiveQuests,
          },
        };
      });
    },

    // Update quest progress when monsters are killed
    updateQuestProgress: (monsterId: string) => {
      set((state) => {
        // Find active quests that have objectives matching the killed monster
        const updatedActiveQuests = state.quests.active.map((quest) => {
          const updatedObjectives = quest.objectives.map((objective) => {
            // Check if this objective targets the killed monster
            if (objective.target === monsterId && !objective.completed) {
              const newCurrent = objective.current + 1;
              const isCompleted = newCurrent >= objective.amount;

              return {
                ...objective,
                current: newCurrent,
                completed: isCompleted,
              };
            }
            return objective;
          });

          // Check if all objectives are completed
          const allObjectivesCompleted = updatedObjectives.every((obj) => obj.completed);

          return {
            ...quest,
            objectives: updatedObjectives,
            // Mark as ready to turn in instead of completed
            readyToTurnIn: allObjectivesCompleted,
            completed: false, // Keep as false until manually turned in
          };
        });

        // Emit events for ready-to-turn-in quests
        const readyQuests = updatedActiveQuests.filter(
          (quest) => quest.readyToTurnIn && !quest.completed
        );
        readyQuests.forEach((quest) => {
          eventBus.emit("quest.ready.to.turn.in", quest);
        });

        // Emit progress update event
        eventBus.emit("quest.progress.updated", {
          monsterId,
          activeQuests: updatedActiveQuests.length,
          readyQuests: readyQuests.length,
        });

        return {
          quests: {
            active: updatedActiveQuests,
            completed: state.quests.completed, // No changes to completed
          },
        };
      });
    },

    turnInQuest: (questId: string) => {
      set((state) => {
        const questIndex = state.quests.active.findIndex((q) => q.id === questId);
        if (questIndex === -1) return state;

        const quest = state.quests.active[questIndex];
        if (!quest.readyToTurnIn) return state;

        // Mark as completed and move to completed array
        const completedQuest = { ...quest, completed: true, readyToTurnIn: false };
        const updatedActive = [...state.quests.active];
        updatedActive.splice(questIndex, 1);

        eventBus.emit("quest.turned.in", completedQuest);

        return {
          quests: {
            active: updatedActive,
            completed: [...state.quests.completed, completedQuest],
          },
        };
      });
    },

    // NEW: Initialize quest system and event listeners
    initializeQuestSystem: () => {
      // Listen for monster death events
      eventBus.on("monster.died", (data: any) => {
        if (data?.type) {
          // Call updateQuestProgress with the monster type (e.g., "decayed-skeleton")
          get().updateQuestProgress(data.type);
        }
      });

      console.log("Quest progress tracking initialized");
    },

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

        // Recalculate stats with new level
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

    // Award experience using the experience system
    awardExperience: (amount: number, x?: number, y?: number) => {
      experienceSystem.awardExperience(amount, x, y);
    },

    // Get current level data based on total experience
    getPlayerLevelFromExperience: () => {
      const state = get();
      return experienceSystem.calculateLevelFromExperience(state.playerCharacter.experience);
    },

    // Update both experience and level in one operation
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

    // Register the experience system
    registerExperienceSystem: () => {
      set((state) => ({
        systems: {
          ...state.systems,
          experienceSystem,
        },
      }));
    },
  }))
);
