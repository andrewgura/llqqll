import { eventBus } from "../utils/EventBus";
import { Quest, QuestObjective } from "../types";

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  type: "kill" | "collect" | "deliver";
  isRepeatable?: boolean; // default false
  objectives: Omit<QuestObjective, "completed">[];
  rewards: Rewards[];
}

interface Rewards {
  name: string;
  amount?: number;
  isFirstTimeOnly?: boolean; // From first completion only
  isRepeatableReward?: boolean; // Not given on first completion; given on all repeat completion if quest is repeatable
}

const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  SkeletonKiller: {
    id: "SkeletonKiller",
    title: "Skeleton Slayer",
    description: "Help the Inn Keeper by eliminating the skeleton threat in the area.",
    type: "kill",
    isRepeatable: true,
    rewards: [
      {
        name: "goldCoins",
        amount: 10,
        isFirstTimeOnly: true,
      },
      {
        name: "questPoints",
        amount: 2,
        isFirstTimeOnly: true,
      },
      {
        name: "questPoints",
        amount: 2,
        isRepeatableReward: true,
      },
      {
        name: "shinySkull",
        amount: 2,
        isRepeatableReward: true,
      },
      {
        name: "experience",
        amount: 100,
        isFirstTimeOnly: true,
      },
      {
        name: "boneShield",
        isFirstTimeOnly: true,
      },
    ],
    objectives: [
      {
        id: "kill-skeletons",
        description: "Kill 1 Decayed Skeletons",
        target: "decayed-skeleton",
        amount: 1,
        isFirstTimeOnly: true,
        current: 0,
      },
      {
        id: "kill-skeletons",
        description: "Kill 3 Decayed Skeletons",
        target: "decayed-skeleton",
        amount: 3,
        isRepeatObjective: true,
        current: 0,
      },
    ],
  },
  BigBonesKiller: {
    id: "BigBonesKiller",
    title: "Big Bones Killer",
    description: "Kill Big Bones",
    type: "kill",
    isRepeatable: false,
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
        id: "kill-bigbones",
        description: "Kill Big Bones",
        target: "big-bones",
        amount: 1,
        isFirstTimeOnly: true,
        current: 0,
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
