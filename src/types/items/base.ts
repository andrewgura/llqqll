/**
 * Core item system types
 */

import { DamageType } from "..";
import { PlayerAttackType } from "../player/character";

/**
 * Item categories for organization and filtering
 */
export enum ItemCategory {
  WEAPON_MELEE = "weapon_melee",
  WEAPON_MAGIC = "weapon_magic",
  WEAPON_RANGED = "weapon_ranged",
  ARMOR = "armor",
  SHIELD = "shield",
  HELMET = "helmet",
  AMULET = "amulet",
  TRINKET = "trinket",
  CONSUMABLE = "consumable",
  FOOD = "food",
  MATERIAL = "material",
  PRODUCT = "product",
  CURRENCY = "currency",
  QUEST = "quest",
  SPELL_SCROLL = "spell_scroll",
}

/**
 * Item types for equipment slots
 */
export enum ItemType {
  WEAPON = "weapon",
  OFFHAND = "offhand",
  ARMOR = "armor",
  HELMET = "helmet",
  AMULET = "amulet",
  TRINKET = "trinket",
  FOOD = "food",
  PRODUCT = "product",
  SPELL_SCROLL = "spell_scroll",
}

/**
 * Item sets for set bonuses
 */
export enum ItemSets {
  SKELETAL_SET = "skeletal",
}

/**
 * Set collection tracking data
 */
export interface SetCollectionData {
  [setType: string]: {
    [slotType: string]: string;
  };
}

/**
 * Set bonus stats
 */
export interface ItemSetBonuses {
  armor?: number;
  health?: number;
  mana?: number;
  melee?: number;
  magic?: number;
  archery?: number;
  shield?: number;
  moveSpeed?: number;
  attackSpeed?: number;
  healthRegen?: number;
  manaRegen?: number;
  capacity?: number;
  regen?: number;
  power?: number;
}

/**
 * Individual item bonus stats (for random bonuses)
 */
export interface ItemBonusStats {
  power?: number;
  armor?: number;
  magic?: number;
  strength?: number;
  health?: number;
  mana?: number;
  melee?: number;
  archery?: number;
  shield?: number;
  moveSpeed?: number;
  healthRegen?: number;
  manaRegen?: number;
  capacity?: number;
  regen?: number;
}

/**
 * Item instance with unique ID and potential bonuses
 */
export interface ItemInstance {
  templateId: string; // Reference to original item template
  instanceId: string; // Unique ID for this specific item
  bonusStats?: ItemBonusStats; // Optional random bonus stats
  quantity?: number; // For stackable items
}

/**
 * Base item template data
 */
export interface ItemData {
  // Core properties
  id: string;
  name: string;
  type: ItemType;
  category?: ItemCategory;
  bonusSkills?: string[];
  sellValue?: number;
  stackable?: boolean;
  damageType?: DamageType; // Default Physical

  // Display properties
  description?: string;
  texture?: string;
  icon?: string;
  rarity?: string;

  // Set properties
  set?: ItemSets;
  setBonus?: ItemSetBonuses;

  // Weapon properties
  weaponType?: string;
  isTwoHanded?: boolean;

  // Secondary Attack
  secondaryDamagePeanlty?: number;
  secondaryAttackType?: PlayerAttackType; // Melee, Magic, or Ranged. This attack with scale with that Skill
  secondaryDamageType?: DamageType; // Default Physical

  // Spell Scroll
  teachesSpell?: string;
  consumable?: boolean;

  // Stats
  power?: number;
  armor?: number;
  melee?: number;
  magic?: number;
  hpRegen?: number;
  mpRegen?: number;
  capacity?: number;
  attackSpeed?: number;
  health?: number;
  mana?: number;
  moveSpeed?: number;

  // Physical properties
  weight: number;
}
