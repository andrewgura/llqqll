/**
 * Quest definition and service types
 */

import { QuestObjective } from "./base";

/**
 * Quest reward definition
 */
export interface QuestReward {
  name: string;
  amount?: number;
  isFirstTimeOnly?: boolean; // From first completion only
  isRepeatableReward?: boolean; // Not given on first completion; given on all repeat completion if quest is repeatable
}

/**
 * Quest definition template for creating quests
 */
export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  type: "kill" | "collect" | "deliver";
  isRepeatable?: boolean; // default false
  objectives: Omit<QuestObjective, "completed">[];
  rewards: QuestReward[];
}
