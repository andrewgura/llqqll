/**
 * Player stat management and calculation types
 */

/**
 * Purchasable stat bonuses
 */
export interface PurchasedStats {
  hpRegen: number;
  mpRegen: number;
  attackSpeed: number;
  moveSpeed: number;
}

/**
 * Record of stat purchases for pricing calculations
 */
export interface StatPurchaseRecord {
  hpRegen: number;
  mpRegen: number;
  attackSpeed: number;
  moveSpeed: number;
}

/**
 * Calculated total stats including base + equipment + skills
 */
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
