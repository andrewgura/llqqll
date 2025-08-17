// src/stores/components/questStore.ts
import { StateCreator } from "zustand";
import { GameState, QuestState } from "../types/gameTypes";
import { Quest, QuestCompletionHistory } from "../../types";
import { questService } from "../../services/QuestService";
import { questRewardService } from "../../services/QuestRewardService";
import { eventBus } from "../../utils/EventBus";
import { PlayerStore } from "./playerStore";
import { InventoryStore } from "./inventoryStore";

const initialQuestState: QuestState = {
  active: [],
  completed: [],
  completionHistory: {},
};

export interface QuestStore {
  // State
  quests: QuestState;

  // Quest methods
  acceptQuest: (questId: string) => void;
  updateQuestProgress: (monsterId: string) => void;
  turnInQuest: (questId: string) => void;
  initializeQuestSystem: () => void;
  canRepeatQuest: (questId: string) => boolean;
}

export const createQuestStore: StateCreator<
  GameState & QuestStore & PlayerStore & InventoryStore,
  [],
  [],
  QuestStore
> = (set, get) => ({
  // Initial state
  quests: initialQuestState,

  acceptQuest: (questId) => {
    const quest = questService.createQuestFromDefinition(questId);
    if (!quest) {
      console.error(`Quest ${questId} not found`);
      return;
    }

    // Get quest definition to check if it's repeatable
    const questDefinition = questService.getQuestDefinition(questId);
    const isRepeatable = questDefinition?.isRepeatable || false;

    set((state) => {
      // Initialize completion history if it doesn't exist
      let updatedCompletionHistory = { ...state.quests.completionHistory };
      if (!updatedCompletionHistory[questId]) {
        updatedCompletionHistory[questId] = {
          completionCount: 0,
          isRepeatable,
        };
      }

      // For repeatable quests, filter objectives based on completion status
      let questToAdd = { ...quest };
      if (questDefinition && updatedCompletionHistory[questId].completionCount > 0) {
        // This is a repeat - only show repeat objectives
        questToAdd.objectives = quest.objectives.filter((obj) => obj.isRepeatObjective);
      } else {
        // This is first time - only show first-time objectives
        questToAdd.objectives = quest.objectives.filter((obj) => !obj.isRepeatObjective);
      }

      return {
        quests: {
          ...state.quests,
          active: [...state.quests.active, questToAdd],
          completionHistory: updatedCompletionHistory,
        },
      };
    });

    eventBus.emit("quest.accepted", quest);
  },

  updateQuestProgress: (monsterId) => {
    set((state) => {
      const updatedActiveQuests = state.quests.active.map((quest) => {
        const updatedObjectives = quest.objectives.map((objective) => {
          if (objective.target === monsterId && !objective.completed) {
            const newCurrent = objective.current + 1;
            return {
              ...objective,
              current: newCurrent,
              completed: newCurrent >= objective.amount,
            };
          }
          return objective;
        });

        const allObjectivesCompleted = updatedObjectives.every((obj) => obj.completed);

        return {
          ...quest,
          objectives: updatedObjectives,
          readyToTurnIn: allObjectivesCompleted,
        };
      });

      const readyQuests = updatedActiveQuests.filter((quest) => quest.readyToTurnIn);

      // Emit events for ready quests
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
          ...state.quests,
          active: updatedActiveQuests,
        },
      };
    });
  },

  turnInQuest: (questId) => {
    set((state) => {
      const questIndex = state.quests.active.findIndex((q) => q.id === questId);
      if (questIndex === -1) {
        console.error(`Quest ${questId} not found in active quests`);
        return state;
      }

      const quest = state.quests.active[questIndex];
      if (!quest.readyToTurnIn) {
        console.error(`Quest ${questId} is not ready to turn in`);
        return state;
      }

      // Get completion history
      const completionHistory = state.quests.completionHistory[questId];
      const isFirstCompletion = !completionHistory || completionHistory.completionCount === 0;

      // Create game store actions interface for the reward service
      const gameStoreActions = {
        updatePlayerGold: (amount: number) => {
          get().updatePlayerGold(amount, false); // false = set absolute value
        },
        updatePlayerQuestPoints: (amount: number) => {
          get().updatePlayerQuestPoints(amount, false); // false = set absolute value
        },
        addItemInstanceToInventory: (itemInstance: any) => {
          return get().addItemInstanceToInventory(itemInstance);
        },
        awardExperience: (amount: number, x?: number, y?: number) => {
          get().awardExperience(amount, x, y);
        },
        getPlayerCharacter: () => {
          const currentState = get();
          return {
            gold: currentState.playerCharacter.gold,
            questPoints: currentState.playerCharacter.questPoints,
          };
        },
      };

      // Distribute quest rewards
      try {
        const rewardResult = questRewardService.distributeQuestRewards(
          questId,
          isFirstCompletion,
          gameStoreActions
        );

        if (rewardResult.success) {
          // Show the reward summary message
          eventBus.emit("ui.message.show", rewardResult.message);

          // Emit detailed reward events for UI updates
          if (rewardResult.goldReceived > 0) {
            eventBus.emit("player.gold.received", {
              amount: rewardResult.goldReceived,
              source: "quest",
              questId,
            });
          }

          if (rewardResult.questPointsReceived > 0) {
            eventBus.emit("player.questPoints.updated", {
              amount: rewardResult.questPointsReceived,
              source: "quest",
              questId,
            });
          }

          if (rewardResult.experienceReceived > 0) {
            eventBus.emit("player.experience.received", {
              amount: rewardResult.experienceReceived,
              source: "quest",
              questId,
            });
          }

          if (rewardResult.itemsReceived.length > 0) {
            eventBus.emit("player.items.received", {
              items: rewardResult.itemsReceived,
              source: "quest",
              questId,
            });
          }
        }
      } catch (error) {
        console.error("Error processing quest rewards:", error);
        eventBus.emit("ui.message.show", "Error processing quest rewards");
      }

      // Update completion history
      const now = Date.now();
      const updatedCompletionHistory = {
        ...completionHistory,
        completionCount: (completionHistory?.completionCount || 0) + 1,
        firstCompletedAt: completionHistory?.firstCompletedAt || now,
        lastCompletedAt: now,
        isRepeatable: completionHistory?.isRepeatable || false,
      };

      // Mark the quest as completed
      const completedQuest = {
        ...quest,
        completed: true,
        completionHistory: updatedCompletionHistory,
      };

      // Update quest state
      const newActiveQuests = state.quests.active.filter((q) => q.id !== questId);

      // Update completed quests - replace existing or add new
      const existingCompletedIndex = state.quests.completed.findIndex((q) => q.id === questId);
      let newCompletedQuests;

      if (existingCompletedIndex >= 0) {
        // Update existing completed quest
        newCompletedQuests = [...state.quests.completed];
        newCompletedQuests[existingCompletedIndex] = completedQuest;
      } else {
        // Add new completed quest
        newCompletedQuests = [...state.quests.completed, completedQuest];
      }

      eventBus.emit("quest.turned.in", {
        quest: completedQuest,
        isFirstCompletion,
        completionCount: updatedCompletionHistory.completionCount,
      });

      return {
        quests: {
          active: newActiveQuests,
          completed: newCompletedQuests,
          completionHistory: {
            ...state.quests.completionHistory,
            [questId]: updatedCompletionHistory,
          },
        },
      };
    });
  },

  // Helper method to check if quest can be repeated
  canRepeatQuest: (questId: string): boolean => {
    const state = get();
    const questDefinition = questService.getQuestDefinition(questId);
    const completionHistory = state.quests.completionHistory[questId];

    return !!(
      questDefinition?.isRepeatable &&
      completionHistory?.completionCount > 0 &&
      !state.quests.active.some((q) => q.id === questId)
    );
  },

  initializeQuestSystem: () => {
    // Listen for monster death events
    eventBus.on("monster.died", (data: any) => {
      if (data?.type) {
        // Call updateQuestProgress with the monster type (e.g., "decayed-skeleton")
        get().updateQuestProgress(data.type);
      }
    });
  },
});
