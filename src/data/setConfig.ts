// src/config/setConfig.ts
import { ItemSets } from "@/types";

export interface SetSlot {
  slotType: string;
  name: string;
  position: string;
  weaponType?: string;
}

export interface SetBonusDefinition {
  items: number;
  bonus: string;
  value: number;
}

export interface ItemBonusDefinition {
  bonus: string;
  value: number;
}

export interface SetConfiguration {
  id: ItemSets;
  name: string;
  totalSlots: number;
  requiredForCompletion: number;
  slots: SetSlot[];
  setBonuses: SetBonusDefinition[];
  itemBonuses: Record<string, ItemBonusDefinition>;
  unlockedOutfit?: string;
}

// Set configurations - this will be the single source of truth for all sets
export const SET_CONFIGURATIONS: Record<ItemSets, SetConfiguration> = {
  [ItemSets.SKELETAL_SET]: {
    id: ItemSets.SKELETAL_SET,
    name: "Skeletal",
    totalSlots: 8,
    requiredForCompletion: 6, // Need 6 out of 8 items to unlock outfit
    slots: [
      { slotType: "weapon", name: "1H Melee", position: "0 0", weaponType: "melee" },
      { slotType: "weapon", name: "1H Magic", position: "1 0", weaponType: "magic" },
      { slotType: "weapon", name: "Ranged", position: "2 0", weaponType: "archery" },
      { slotType: "shield", name: "Shield", position: "0 1" },
      { slotType: "armor", name: "Armor", position: "1 1" },
      { slotType: "helmet", name: "Helmet", position: "2 1" },
      { slotType: "trinket", name: "Trinket", position: "0 2" },
      { slotType: "amulet", name: "Amulet", position: "1 2" },
    ],
    setBonuses: [
      { items: 2, bonus: "Melee", value: 1 },
      { items: 4, bonus: "Health", value: 50 },
      { items: 6, bonus: "Armor", value: 5 },
      { items: 8, bonus: "All Stats", value: 2 },
    ],
    itemBonuses: {
      boneClub: { bonus: "Melee", value: 1 },
      boneWand: { bonus: "Magic", value: 1 },
      throwableSkull: { bonus: "Archery", value: 1 },
      boneShield: { bonus: "Armor", value: 1 },
      skeletalArmor: { bonus: "Health", value: 20 },
      boneCharm: { bonus: "Regen", value: 2 },
      skullCap: { bonus: "Mana", value: 20 },
      skeletalMedallion: { bonus: "Move Speed", value: 200 },
    },
    unlockedOutfit: "skeleton-outfit",
  },
};

// Utility functions to work with set configurations
export class SetConfigUtils {
  /**
   * Get configuration for a specific set
   */
  static getSetConfig(setType: ItemSets): SetConfiguration | null {
    return SET_CONFIGURATIONS[setType] || null;
  }

  /**
   * Get all available sets
   */
  static getAllSets(): SetConfiguration[] {
    return Object.values(SET_CONFIGURATIONS);
  }

  /**
   * Check if an item belongs to a specific set
   */
  static isItemInSet(itemId: string, setType: ItemSets): boolean {
    const config = this.getSetConfig(setType);
    return config ? itemId in config.itemBonuses : false;
  }

  /**
   * Get the specific slot an item should go into for a set
   */
  static getItemSlotType(itemId: string, setType: ItemSets, itemData: any): string | null {
    const config = this.getSetConfig(setType);
    if (!config || !this.isItemInSet(itemId, setType)) {
      return null;
    }

    // Map item categories to slot types
    if (itemData?.category) {
      switch (itemData.category) {
        case "weapon_melee":
        case "weapon_magic":
        case "weapon_ranged":
          return "weapon";
        case "shield":
          return "shield";
        case "armor":
          return "armor";
        case "helmet":
          return "helmet";
        case "trinket":
          return "trinket";
        case "amulet":
          return "amulet";
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * Check if an item can be placed in a specific slot
   */
  static canItemGoInSlot(
    itemId: string,
    slotType: string,
    setType: ItemSets,
    itemData: any
  ): boolean {
    const config = this.getSetConfig(setType);
    if (!config || !this.isItemInSet(itemId, setType)) {
      return false;
    }

    const requiredSlotType = this.getItemSlotType(itemId, setType, itemData);
    return requiredSlotType === slotType;
  }

  /**
   * Calculate set completion status
   */
  static calculateSetProgress(
    setCollections: any,
    setType: ItemSets
  ): {
    collectedCount: number;
    totalSlots: number;
    requiredForCompletion: number;
    isComplete: boolean;
    progressPercentage: number;
  } {
    const config = this.getSetConfig(setType);
    if (!config) {
      return {
        collectedCount: 0,
        totalSlots: 0,
        requiredForCompletion: 0,
        isComplete: false,
        progressPercentage: 0,
      };
    }

    const collectionItems = setCollections[setType] || {};
    const collectedCount = Object.values(collectionItems).filter((id: any) => id !== "").length;
    const isComplete = collectedCount >= config.requiredForCompletion;
    const progressPercentage = (collectedCount / config.totalSlots) * 100;

    return {
      collectedCount,
      totalSlots: config.totalSlots,
      requiredForCompletion: config.requiredForCompletion,
      isComplete,
      progressPercentage,
    };
  }

  /**
   * Get formatted set name for display
   */
  static formatSetName(setType: string): string {
    return setType
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Get formatted bonus type for display
   */
  static formatBonusType(bonusType: string): string {
    const formatted = bonusType.replace(/([A-Z])/g, " $1");
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
