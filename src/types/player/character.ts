/**
 * Player character and equipment types
 */

import { ItemInstance } from "../items/base";
import { PurchasedStats, StatPurchaseRecord } from "./stats";
import { SkillData } from "./skills";

/**
 * Player classes
 */
export enum Classes {
  KNIGHT = "knight",
  MAGE = "mage",
  RANGER = "ranger",
  NONE = "none",
}

/**
 * Player attack types for combat
 */
export enum PlayerAttackType {
  Melee = "melee",
  Ranged = "ranged",
  Magic = "magic",
}

/**
 * Equipment slot configuration
 */
export interface PlayerCharacterEquipment {
  weapon: ItemInstance | null;
  shield: ItemInstance | null;
  trinket: ItemInstance | null;
  helmet: ItemInstance | null;
  amulet: ItemInstance | null;
  armor: ItemInstance | null;
}

/**
 * Player character skills structure
 */
export interface PlayerCharacterSkills {
  playerLevel: SkillData;
  meleeWeapons: SkillData;
  archery: SkillData;
  magic: SkillData;
  shield: SkillData;
  [key: string]: SkillData;
}

/**
 * Complete player character state
 * Consolidated from both main types and gameTypes versions
 */
export interface PlayerCharacterState {
  health: number;
  maxHealth: number;
  lastAttackTime: number;
  experience: number;
  class: Classes;
  equipment: PlayerCharacterEquipment;
  inventory: ItemInstance[];
  skills: PlayerCharacterSkills;
  gold: number;
  questPoints: number;
  maxCapacity: number;
  currentCapacity: number;
  teleportPosition?: { x: number; y: number };
  purchasedStats: PurchasedStats;
  statPurchaseRecord: StatPurchaseRecord;
}

/**
 * Equipment change event data
 */
export interface EquipmentChangedEvent {
  equipment: PlayerCharacterEquipment;
  source: string;
}
