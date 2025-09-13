// Interface for NPC data
export interface NPCData {
  id: string;
  name: string;
  texture: string;
  dialog?: string[];
  isMerchant?: boolean;
  shopItems?: ShopItem[];
  interactionRadius?: number;
  quests?: QuestType;
  isMainQuestGiver?: boolean;
  isQuestGiver?: boolean;
  isWarriorTrainer?: boolean;
  isMageTrainer?: boolean;
  isArcherTrainer?: boolean;
  isStatSeller?: boolean;
}

export interface ShopItem {
  itemId: string;
  price: number;
}

export interface NpcQuest {
  name: string;
  requirements?: any;
}

interface QuestType {
  side?: NpcQuest[] | null;
  main?: NpcQuest[] | null;
}
