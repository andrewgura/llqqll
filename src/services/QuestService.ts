import { eventBus } from "../utils/EventBus";
import { Quest, QuestObjective } from "../types";

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  type: "kill" | "collect" | "deliver";
  isRepeatable?: boolean; // default false
  target?: string; // For kill/collect quests
  amount?: number;
  objectives: Omit<QuestObjective, "completed">[];
  rewards: Rewards[];
}

interface Rewards {
  name: string;
  amount?: number;
  isFirstTimeOnly?: boolean; // From first completetion only
  isRepeatableReward?: boolean; // Not given on first completetion; given on all repeat completion if quest is repeatable
}

const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  SkeletonKiller: {
    id: "SkeletonKiller",
    title: "Skeleton Slayer",
    description: "Help the Inn Keeper by eliminating the skeleton threat in the area.",
    type: "kill",
    target: "decayed-skeleton",
    isRepeatable: true,
    amount: 10,
    rewards: [
      {
        name: "goldCoins",
        amount: 10,
      },
      {
        name: "questPoints",
        amount: 2,
      },
      {
        name: "boneShield",
        isFirstTimeOnly: true,
      },
    ],
    objectives: [
      {
        id: "kill-skeletons",
        description: "Kill 50 Decayed Skeletons (0/50)",
      },
    ],
  },
};

class QuestService {
  private questDefinitions: Record<string, QuestDefinition> = {};

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.questDefinitions = { ...QUEST_DEFINITIONS };
    eventBus.emit("questService.initialized", {
      count: Object.keys(this.questDefinitions).length,
    });
  }

  getQuestDefinition(questId: string): QuestDefinition | null {
    return this.questDefinitions[questId] || null;
  }

  createQuestFromDefinition(questId: string): Quest | null {
    const definition = this.getQuestDefinition(questId);
    if (!definition) return null;

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      objectives: definition.objectives.map((obj) => ({ ...obj, completed: false })),
      completed: false,
    };
  }

  getAllQuestDefinitions(): QuestDefinition[] {
    return Object.values(this.questDefinitions);
  }
}

export const questService = new QuestService();
