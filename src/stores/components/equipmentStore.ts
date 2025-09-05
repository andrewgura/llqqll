import { StateCreator } from "zustand";
import { GameState, CalculatedStats } from "../types/gameTypes";
import { PlayerCharacterEquipment, ItemInstance, PlayerCharacterState } from "../../types";
import { ItemInstanceManager } from "../../utils/ItemInstanceManager";
import { eventBus } from "../../utils/EventBus";

export const calculateEquipmentBonuses = (equipment: PlayerCharacterEquipment) => {
  const bonuses = {
    health: 0,
    mana: 0,
    power: 0,
    armor: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    healthRegen: 0,
    manaRegen: 0,
    capacity: 0,
    melee: 0,
  };

  // Track equipped sets for set bonuses
  const equippedSets: Record<string, ItemInstance[]> = {};

  Object.values(equipment).forEach((itemInstance) => {
    if (!itemInstance) return;

    // Get combined stats (base + bonuses) - this already includes bonusStats
    const itemData = ItemInstanceManager.getCombinedStats(itemInstance);
    if (itemData) {
      bonuses.power += itemData.power || 0;
      bonuses.armor += itemData.armor || 0;
      bonuses.healthRegen += itemData.hpRegen || 0;
      bonuses.manaRegen += itemData.mpRegen || 0;
      bonuses.health += itemData.health || 0;
      bonuses.mana += itemData.mana || 0;
      bonuses.moveSpeed += itemData.moveSpeed || 0;
      bonuses.attackSpeed += itemData.attackSpeed || 0;
      bonuses.capacity += itemData.capacity || 0;
      bonuses.melee += itemData.melee || 0;

      // Track sets - store the actual item instances
      if (itemData.set) {
        if (!equippedSets[itemData.set]) {
          equippedSets[itemData.set] = [];
        }
        equippedSets[itemData.set].push(itemInstance);
      }
    }
  });

  // Apply set bonuses for sets with 2+ pieces
  Object.entries(equippedSets).forEach(([setName, items]) => {
    if (items.length >= 2) {
      // Apply set bonus from each equipped set piece
      items.forEach((item) => {
        const itemData = ItemInstanceManager.getCombinedStats(item);
        if (itemData?.setBonus) {
          bonuses.power += itemData.setBonus.power || 0;
          bonuses.armor += itemData.setBonus.armor || 0;
          bonuses.healthRegen += itemData.setBonus.healthRegen || 0;
          bonuses.manaRegen += itemData.setBonus.manaRegen || 0;
          bonuses.health += itemData.setBonus.health || 0;
          bonuses.mana += itemData.setBonus.mana || 0;
          bonuses.moveSpeed += itemData.setBonus.moveSpeed || 0;
          bonuses.attackSpeed += itemData.setBonus.attackSpeed || 0;
          bonuses.capacity += itemData.setBonus.capacity || 0;
          bonuses.melee += itemData.setBonus.melee || 0;
        }
      });
    }
  });

  return bonuses;
};

export const calculateTotalStats = (
  playerCharacter: PlayerCharacterState,
  equipmentBonuses: any
): CalculatedStats => {
  const baseHealth = 100;
  const baseMana = 100;
  const basePower = 1;
  const baseArmor = 1;
  const baseMoveSpeed = 250;
  const baseAttackSpeed = 0;
  const baseHealthRegen = 1;
  const baseManaRegen = 2;

  // Get skill bonuses
  const playerLevel = playerCharacter.skills?.playerLevel?.level || 1;
  const meleeLevel = playerCharacter.skills?.meleeWeapons?.level || 1;
  const magicLevel = playerCharacter.skills?.magic?.level || 1;
  const shieldLevel = playerCharacter.skills?.shield?.level || 1;

  // Calculate skill bonuses
  const skillHealthBonus = (playerLevel - 1) * 5;
  const skillManaBonus = (magicLevel - 1) * 3;
  const skillPowerBonus = Math.floor((meleeLevel - 1) * 0.5);
  const skillArmorBonus = Math.floor((shieldLevel - 1) * 0.3);

  const purchasedStats = playerCharacter.purchasedStats || {
    hpRegen: 0,
    mpRegen: 0,
    attackSpeed: 0,
    moveSpeed: 0,
  };

  return {
    totalHealth: baseHealth + equipmentBonuses.health + skillHealthBonus,
    totalMana: baseMana + equipmentBonuses.mana + skillManaBonus,
    totalPower: basePower + equipmentBonuses.power + skillPowerBonus,
    totalArmor: baseArmor + equipmentBonuses.armor + skillArmorBonus,
    totalMoveSpeed: baseMoveSpeed + equipmentBonuses.moveSpeed + purchasedStats.moveSpeed,
    totalAttackSpeed: baseAttackSpeed + equipmentBonuses.attackSpeed + purchasedStats.attackSpeed,
    totalHealthRegen: baseHealthRegen + equipmentBonuses.healthRegen + purchasedStats.hpRegen,
    totalManaRegen: baseManaRegen + equipmentBonuses.manaRegen + purchasedStats.mpRegen,
    equipmentBonuses: {
      health: equipmentBonuses.health,
      mana: equipmentBonuses.mana,
      power: equipmentBonuses.power,
      armor: equipmentBonuses.armor,
      moveSpeed: equipmentBonuses.moveSpeed,
      attackSpeed: equipmentBonuses.attackSpeed,
      healthRegen: equipmentBonuses.healthRegen,
      manaRegen: equipmentBonuses.manaRegen,
      melee: equipmentBonuses.melee,
    },
  };
};

export interface EquipmentStore {
  // Equipment methods
  setPlayerCharacterEquipment: (equipment: PlayerCharacterEquipment, source?: string) => void;
  recalculateStats: () => void;
}

export const createEquipmentStore: StateCreator<
  GameState & EquipmentStore,
  [],
  [],
  EquipmentStore
> = (set, get) => ({
  setPlayerCharacterEquipment: (equipment: PlayerCharacterEquipment, source?: string) => {
    set((state) => {
      const newState = {
        playerCharacter: {
          ...state.playerCharacter,
          equipment,
        },
      };

      // Recalculate stats
      const equipmentBonuses = calculateEquipmentBonuses(equipment);
      const calculatedStats = calculateTotalStats(newState.playerCharacter, equipmentBonuses);

      eventBus.emit("equipment.changed", {
        equipment,
        source: source || "unknown",
      });
      eventBus.emit("player.stats.updated", calculatedStats);
      eventBus.emit("player.moveSpeed.updated", calculatedStats.totalMoveSpeed);

      return {
        ...newState,
        calculatedStats,
      };
    });
  },

  recalculateStats: () => {
    const state = get();
    const equipmentBonuses = calculateEquipmentBonuses(state.playerCharacter.equipment);
    const calculatedStats = calculateTotalStats(state.playerCharacter, equipmentBonuses);

    set({ calculatedStats });
    eventBus.emit("player.stats.updated", calculatedStats);
  },
});
