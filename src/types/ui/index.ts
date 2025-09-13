// src/types/ui/index.ts
/**
 * UI component types
 */

/**
 * Navigation button types for UI navbar
 */
export enum NavButtonType {
  QUESTS = "quests",
  SET_COLLECTION = "setCollection",
  ABILITIES = "abilities",
  BACKPACK = "backpack",
  SKILLS = "skills",
  CREATURES = "creatures",
  OUTFITS = "outfits",
}

/**
 * Quest log tab types
 */
export enum QuestTab {
  MAIN = "main",
  SIDE = "side",
  RIDDLES = "riddles",
}

/**
 * Quest log interfaces
 */
export interface MainQuestStep {
  page: number;
  step: number;
  task: string;
  img: string;
}

export interface SideQuest {
  name: string;
  type: string;
  amount: number;
  reward: number;
  description: string;
  isRepeatable: boolean;
}

export interface Riddle {
  name: string;
  img: string;
  reward: number;
}
