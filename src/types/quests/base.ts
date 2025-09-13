/**
 * Core quest system types
 */

/**
 * Quest objective data structure
 */
export interface QuestObjective {
  id: string;
  description: string;
  target?: string;
  amount: number;
  current: number;
  completed: boolean;
  isFirstTimeOnly?: boolean; // From first completion only
  isRepeatableReward?: boolean; // Not given on first completion; given on all repeat completion if quest is repeatable
  isRepeatObjective?: boolean; // Required for repeat completions
}

/**
 * Quest completion history tracking
 */
export interface QuestCompletionHistory {
  completionCount: number;
  firstCompletedAt?: number; // timestamp
  lastCompletedAt?: number; // timestamp
  isRepeatable: boolean;
}

/**
 * Core quest data structure
 */
export interface Quest {
  id: string;
  readyToTurnIn?: boolean;
  title: string;
  description: string;
  objectives: QuestObjective[];
  completed: boolean;
  completionHistory?: QuestCompletionHistory; // New field for tracking completions
}

/**
 * Quest state storage for game state
 */
export interface QuestState {
  active: Quest[];
  completed: Quest[];
  completionHistory: Record<string, QuestCompletionHistory>; // Track completion history globally
}
