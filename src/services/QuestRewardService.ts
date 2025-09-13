import { questService } from "./QuestService";
import {
  GameStoreActions,
  ItemInstance,
  QuestDefinition,
  RewardDistributionResult,
  RewardToGive,
} from "../types";
import { eventBus } from "../utils/EventBus";
import { PhaserSceneManager } from "./PhaserSceneManager";
import { GameScene } from "../scenes/GameScene";
import { ItemDictionary } from "./ItemDictionaryService";
import { v4 as uuidv4 } from "uuid";

class QuestRewardService {
  /**
   * Distributes quest rewards to the player
   * @param questId - The ID of the quest being turned in
   * @param isFirstCompletion - Whether this is the first time completing this quest
   * @param gameStoreActions - Game store actions to avoid circular dependencies
   * @returns RewardDistributionResult with details of what was given
   */
  distributeQuestRewards(
    questId: string,
    isFirstCompletion: boolean = true,
    gameStoreActions?: GameStoreActions
  ): RewardDistributionResult {
    const questDefinition = questService.getQuestDefinition(questId);

    if (!questDefinition) {
      return {
        success: false,
        itemsReceived: [],
        itemsDropped: [],
        goldReceived: 0,
        questPointsReceived: 0,
        experienceReceived: 0,
        message: "Quest definition not found",
      };
    }

    // Determine which rewards to give based on quest completion status
    const rewardsToGive = this.determineRewardsToGive(questDefinition, isFirstCompletion);

    // Distribute the rewards
    return this.processRewards(rewardsToGive, questDefinition.title, gameStoreActions);
  }

  /**
   * Determines which rewards should be given based on quest definition and completion status
   */
  private determineRewardsToGive(
    questDefinition: QuestDefinition,
    isFirstCompletion: boolean
  ): RewardToGive[] {
    const rewardsToGive: RewardToGive[] = [];

    questDefinition.rewards.forEach((reward) => {
      let shouldGive = false;

      if (isFirstCompletion) {
        // First completion: give all rewards except those marked as repeatable-only
        shouldGive = !reward.isRepeatableReward;
      } else {
        // Repeat completion: only give repeatable rewards (not first-time-only)
        shouldGive =
          !reward.isFirstTimeOnly &&
          (reward.isRepeatableReward || (!reward.isFirstTimeOnly && !reward.isRepeatableReward));
      }

      if (shouldGive) {
        // Determine reward type
        let type: "gold" | "item" | "questPoints" | "experience" = "item";
        if (reward.name === "goldCoins") {
          type = "gold";
        } else if (reward.name === "questPoints") {
          type = "questPoints";
        } else if (reward.name === "experience") {
          type = "experience";
        }

        rewardsToGive.push({
          type,
          name: reward.name,
          amount: reward.amount || 1,
          shouldGive: true,
        });
      }
    });

    return rewardsToGive;
  }

  /**
   * Processes the actual reward distribution
   */
  private processRewards(
    rewardsToGive: RewardToGive[],
    questTitle: string,
    gameStoreActions?: GameStoreActions
  ): RewardDistributionResult {
    const result: RewardDistributionResult = {
      success: true,
      itemsReceived: [],
      itemsDropped: [],
      goldReceived: 0,
      questPointsReceived: 0,
      experienceReceived: 0,
      message: "",
    };

    if (!gameStoreActions) {
      console.error("Game store actions not provided to QuestRewardService");
      return {
        success: false,
        itemsReceived: [],
        itemsDropped: [],
        goldReceived: 0,
        questPointsReceived: 0,
        experienceReceived: 0,
        message: "Game store not available",
      };
    }

    try {
      const playerCharacter = gameStoreActions.getPlayerCharacter();

      // Process each reward
      for (const reward of rewardsToGive) {
        switch (reward.type) {
          case "gold":
            // Add gold to player
            const newGoldAmount = playerCharacter.gold + reward.amount;
            gameStoreActions.updatePlayerGold(newGoldAmount);
            result.goldReceived += reward.amount;

            eventBus.emit("ui.message.show", `Received ${reward.amount} gold!`);
            eventBus.emit("player.reward.received", {
              type: "gold",
              amount: reward.amount,
              questTitle,
            });
            break;

          case "questPoints":
            // Add quest points to player
            const newQuestPointsAmount = playerCharacter.questPoints + reward.amount;
            gameStoreActions.updatePlayerQuestPoints(newQuestPointsAmount);
            result.questPointsReceived += reward.amount;

            eventBus.emit("ui.message.show", `Received ${reward.amount} quest points!`);
            eventBus.emit("player.reward.received", {
              type: "questPoints",
              amount: reward.amount,
              questTitle,
            });
            break;

          case "experience":
            // Award experience to player
            gameStoreActions.awardExperience(reward.amount);
            result.experienceReceived += reward.amount;

            eventBus.emit("ui.message.show", `Received ${reward.amount} experience!`);
            eventBus.emit("player.reward.received", {
              type: "experience",
              amount: reward.amount,
              questTitle,
            });
            break;

          case "item":
            // Try to give item to player
            const itemResult = this.giveItemToPlayer(reward.name, reward.amount, gameStoreActions);

            if (itemResult.addedToInventory > 0) {
              result.itemsReceived.push(`${reward.name} x${itemResult.addedToInventory}`);
            }

            if (itemResult.droppedToGround > 0) {
              result.itemsDropped.push(`${reward.name} x${itemResult.droppedToGround}`);
            }
            break;
        }
      }

      // Generate summary message
      result.message = this.generateRewardMessage(result, questTitle);

      // Emit overall reward completion event
      eventBus.emit("player.quest.rewards.distributed", {
        questTitle,
        result,
      });
    } catch (error) {
      console.error("Error distributing quest rewards:", error);
      result.success = false;
      result.message = "Failed to distribute quest rewards";

      eventBus.emit("error.quest.reward.distribution", {
        questId: questTitle,
        error,
      });
    }

    return result;
  }

  /**
   * Attempts to give an item to the player, adding to inventory first, then dropping to ground
   */
  private giveItemToPlayer(
    itemName: string,
    quantity: number,
    gameStoreActions: GameStoreActions
  ): { addedToInventory: number; droppedToGround: number } {
    let addedToInventory = 0;
    let droppedToGround = 0;

    // Create item instances for the reward
    for (let i = 0; i < quantity; i++) {
      const itemInstance: ItemInstance = {
        instanceId: uuidv4(),
        templateId: itemName,
        quantity: 1, // Individual items
        bonusStats: undefined, // Quest rewards typically don't have bonus stats
      };

      // Try to add to inventory first
      const addedSuccessfully = gameStoreActions.addItemInstanceToInventory(itemInstance);

      if (addedSuccessfully) {
        addedToInventory++;
        eventBus.emit("ui.message.show", `Received ${this.getItemDisplayName(itemName)}!`);
      } else {
        // Inventory full, drop to ground
        if (this.dropItemToGround(itemInstance)) {
          droppedToGround++;
          eventBus.emit(
            "ui.message.show",
            `${this.getItemDisplayName(itemName)} dropped on ground (inventory full)!`
          );
        } else {
          console.error(`Failed to drop item ${itemName} to ground`);
          eventBus.emit(
            "ui.message.show",
            `Failed to receive ${this.getItemDisplayName(itemName)} (inventory full, ground drop failed)!`
          );
        }
      }
    }

    return { addedToInventory, droppedToGround };
  }

  /**
   * Drops an item to the ground near the player
   */
  private dropItemToGround(itemInstance: ItemInstance): boolean {
    try {
      // Get the current game scene
      const gameScene = PhaserSceneManager.getCurrentScene() as GameScene;

      if (!gameScene || !gameScene.playerCharacter) {
        console.error("Game scene or player not available for item drop");
        return false;
      }

      // Get player position
      const playerX = gameScene.playerCharacter.x;
      const playerY = gameScene.playerCharacter.y;

      // Create a slight offset so items don't stack exactly on the player
      const offsetX = (Math.random() - 0.5) * 50; // Random offset within 50 pixels
      const offsetY = (Math.random() - 0.5) * 50;

      // Create the item in the game world
      const worldItem = gameScene.spawnItem(
        itemInstance.templateId,
        playerX + offsetX,
        playerY + offsetY,
        itemInstance.instanceId,
        itemInstance.bonusStats,
        itemInstance.quantity || 1
      );

      if (worldItem) {
        eventBus.emit("item.dropped.world", {
          itemInstance,
          x: playerX + offsetX,
          y: playerY + offsetY,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error dropping item to ground:", error);
      return false;
    }
  }

  /**
   * Gets a user-friendly display name for an item
   */
  private getItemDisplayName(itemName: string): string {
    const item = ItemDictionary.getItem(itemName);
    return item?.name || itemName;
  }

  /**
   * Generates a summary message for the rewards received
   */
  private generateRewardMessage(result: RewardDistributionResult, questTitle: string): string {
    const parts: string[] = [`Quest "${questTitle}" completed!`];

    if (result.goldReceived > 0) {
      parts.push(`+${result.goldReceived} gold`);
    }

    if (result.questPointsReceived > 0) {
      parts.push(`+${result.questPointsReceived} quest points`);
    }

    if (result.experienceReceived > 0) {
      parts.push(`+${result.experienceReceived} experience`);
    }

    if (result.itemsReceived.length > 0) {
      parts.push(`Items received: ${result.itemsReceived.join(", ")}`);
    }

    if (result.itemsDropped.length > 0) {
      parts.push(`Items dropped nearby: ${result.itemsDropped.join(", ")}`);
    }

    return parts.join(" | ");
  }
}

// Export singleton instance
export const questRewardService = new QuestRewardService();
