// src/stores/types/gameTypes.ts
import {
  PlayerCharacterEquipment,
  ItemInstance,
  SetCollectionData,
  Quest,
  QuestCompletionHistory,
  Classes,
  PurchasedStats,
  StatPurchaseRecord,
} from "../../types";

export interface CalculatedStats {
  // Total stats including base + equipment + skills
  totalHealth: number;
  totalMana: number;
  totalPower: number;
  totalArmor: number;
  totalMoveSpeed: number;
  totalAttackSpeed: number;
  totalHealthRegen: number;
  totalManaRegen: number;

  // Equipment bonuses only
  equipmentBonuses: {
    health: number;
    mana: number;
    power: number;
    armor: number;
    moveSpeed: number;
    attackSpeed: number;
    healthRegen: number;
    manaRegen: number;
    melee: number;
  };
}

export interface PlayerCharacterState {
  health: number;
  maxHealth: number;
  lastAttackTime: number;
  experience: number;
  class: Classes;
  equipment: PlayerCharacterEquipment;
  inventory: ItemInstance[];
  skills: {
    [key: string]: {
      level: number;
      experience: number;
      maxExperience: number;
    };
  };
  gold: number;
  questPoints: number;
  maxCapacity: number;
  currentCapacity: number;
  teleportPosition?: { x: number; y: number };
  purchasedStats?: PurchasedStats;
  statPurchaseRecord?: StatPurchaseRecord;
}

export interface QuestState {
  active: Quest[];
  completed: Quest[];
  completionHistory: Record<string, QuestCompletionHistory>;
}

// Core game state structure
export interface GameState {
  playerCharacter: PlayerCharacterState;
  calculatedStats: CalculatedStats;
  quests: QuestState;
  inputFocused: boolean;
  setCollections: SetCollectionData;
  currentMap: string;
  systems?: Record<string, any>;
}
