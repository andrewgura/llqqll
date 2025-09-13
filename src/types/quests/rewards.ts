/**
 * Quest reward system types
 */

import { ItemInstance } from "../items/base";

/**
 * Result of quest reward distribution
 */
export interface RewardDistributionResult {
  success: boolean;
  itemsReceived: string[];
  itemsDropped: string[];
  goldReceived: number;
  questPointsReceived: number;
  experienceReceived: number;
  message: string;
}

/**
 * Internal reward processing data
 */
export interface RewardToGive {
  type: "gold" | "item" | "questPoints" | "experience";
  name: string;
  amount: number;
  shouldGive: boolean;
}

/**
 * Game store actions interface for quest reward service
 * Used to avoid circular dependencies
 */
export interface GameStoreActions {
  updatePlayerGold: (amount: number) => void;
  updatePlayerQuestPoints: (amount: number) => void;
  addItemInstanceToInventory: (itemInstance: ItemInstance) => boolean;
  awardExperience: (amount: number, x?: number, y?: number) => void;
  getPlayerCharacter: () => {
    gold: number;
    questPoints: number;
  };
}
