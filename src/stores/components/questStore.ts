// src/stores/stores/questStore.ts
import { StateCreator } from "zustand";
import { GameState, QuestState } from "../types/gameTypes";
import { Quest } from "../../types";
import { questService } from "../../services/QuestService";
import { questRewardService } from "../../services/QuestRewardService";
import { eventBus } from "../../utils/EventBus";
import { PlayerStore } from "./playerStore";
import { InventoryStore } from "./inventoryStore";

const initialQuestState: QuestState = {
  active: [],
  completed: [],
};

export interface QuestStore {
  // State
  quests: QuestState;

  // Quest methods
  acceptQuest: (questId: string) => void;
  updateQuestProgress: (monsterId: string) => void;
  turnInQuest: (questId: string) => void;
  initializeQuestSystem: () => void;
}

export const createQuestStore: StateCreator<
  GameState & QuestStore & PlayerStore & InventoryStore,
  [],
  [],
  QuestStore
> = (set, get) => ({
  // Initial state
  quests: initialQuestState,

  // EXACT COPY from original gameStore
  acceptQuest: (questId) => {
    const quest = questService.createQuestFromDefinition(questId);
    if (!quest) {
      console.error(`Quest ${questId} not found`);
      return;
    }

    set((state) => ({
      quests: {
        ...state.quests,
        active: [...state.quests.active, quest],
      },
    }));

    eventBus.emit("quest.accepted", quest);
  },

  // EXACT COPY from original gameStore
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
          active: updatedActiveQuests,
          completed: state.quests.completed,
        },
      };
    });
  },

  // EXACT COPY from original gameStore
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

      // Check if this is the first completion of this quest
      const hasCompletedBefore = state.quests.completed.some((q) => q.id === questId);
      const isFirstCompletion = !hasCompletedBefore;

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

          // Log reward details for debugging
          console.log("Quest rewards distributed:", rewardResult);

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

      // Mark the quest as completed
      const completedQuest = { ...quest, completedAt: Date.now() };

      // Update quest state
      const newActiveQuests = state.quests.active.filter((q) => q.id !== questId);
      let newCompletedQuests = state.quests.completed;

      if (hasCompletedBefore) {
        // Update existing completed quest
        newCompletedQuests = state.quests.completed.map((q) =>
          q.id === questId ? completedQuest : q
        );
      } else {
        // Add to completed quests
        newCompletedQuests = [...state.quests.completed, completedQuest];
      }

      eventBus.emit("quest.turned.in", {
        quest: completedQuest,
        isFirstCompletion,
      });

      return {
        quests: {
          active: newActiveQuests,
          completed: newCompletedQuests,
        },
      };
    });
  },

  // EXACT COPY from original gameStore
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
});
