// src/types/game/state.ts
/**
 * Game state management types
 */

import { PlayerCharacterState } from "../player/character";
import { CalculatedStats } from "../player/stats";
import { QuestState } from "../quests/base";
import { SetCollectionData } from "../items/base";

/**
 * Core game state structure for Zustand store
 */
export interface GameState {
  playerCharacter: PlayerCharacterState;
  calculatedStats: CalculatedStats;
  quests: QuestState;
  inputFocused: boolean;
  setCollections: SetCollectionData;
  currentMap: string;
  systems?: Record<string, any>;
}

/**
 * Legacy game state data interface
 * (kept for backward compatibility during migration)
 */
export interface GameStateData {
  playerCharacter: PlayerCharacterState;
  quests: QuestState;
  inputFocused: boolean;
  setCollections?: SetCollectionData;
}
