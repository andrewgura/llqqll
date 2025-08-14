import { StateCreator } from "zustand";
import { GameState } from "../types/gameTypes";
import { ItemInstance } from "../../types";
import { ItemDictionary } from "../../services/ItemDictionaryService";
import { eventBus } from "../../utils/EventBus";

export interface InventoryStore {
  getItemInstanceById: (instanceId: string) => ItemInstance | undefined;
  addItemInstanceToInventory: (itemInstance: ItemInstance) => boolean;
  removeItemInstanceFromInventory: (instanceId: string, quantity?: number) => boolean;
  moveItemInstance: (fromInstanceId: string, toSlot: string, toInstanceId?: string) => boolean;
  updateInventoryCapacity: () => void;
}

export const createInventoryStore: StateCreator<
  GameState & InventoryStore,
  [],
  [],
  InventoryStore
> = (set, get) => ({
  getItemInstanceById: (instanceId: string) => {
    const state = get();

    // Check inventory first
    const inventoryItem = state.playerCharacter.inventory.find(
      (item) => item.instanceId === instanceId
    );
    if (inventoryItem) return inventoryItem;

    // Check equipment
    const equipment = state.playerCharacter.equipment;
    for (const slotItem of Object.values(equipment)) {
      if (slotItem && slotItem.instanceId === instanceId) {
        return slotItem;
      }
    }

    return undefined;
  },

  addItemInstanceToInventory: (itemInstance: ItemInstance) => {
    const state = get();
    const itemData = ItemDictionary.getItem(itemInstance.templateId);

    if (itemData?.stackable) {
      const existingItemIndex = state.playerCharacter.inventory.findIndex(
        (item) => item.templateId === itemInstance.templateId
      );

      if (existingItemIndex !== -1) {
        const newInventory = [...state.playerCharacter.inventory];
        const existingItem = newInventory[existingItemIndex];
        const currentQuantity = existingItem.quantity || 1;
        const addingQuantity = itemInstance.quantity || 1;

        newInventory[existingItemIndex] = {
          ...existingItem,
          quantity: currentQuantity + addingQuantity,
        };

        set((state) => ({
          playerCharacter: {
            ...state.playerCharacter,
            inventory: newInventory,
          },
        }));

        get().updateInventoryCapacity();
        eventBus.emit("inventory.item.added", {
          itemInstance: newInventory[existingItemIndex],
          stacked: true,
        });

        return true;
      }
    }

    // Add as new item
    const newInventory = [...state.playerCharacter.inventory, itemInstance];

    set((state) => ({
      playerCharacter: {
        ...state.playerCharacter,
        inventory: newInventory,
      },
    }));

    get().updateInventoryCapacity();
    eventBus.emit("inventory.item.added", {
      itemInstance,
      stacked: false,
    });

    return true;
  },

  removeItemInstanceFromInventory: (instanceId: string, quantity?: number) => {
    const state = get();
    const itemIndex = state.playerCharacter.inventory.findIndex(
      (item) => item.instanceId === instanceId
    );

    if (itemIndex === -1) {
      console.warn(`Item with instanceId ${instanceId} not found in inventory`);
      return false;
    }

    const item = state.playerCharacter.inventory[itemIndex];
    const newInventory = [...state.playerCharacter.inventory];

    if (quantity && item.quantity && item.quantity > quantity) {
      // Reduce quantity for stackable items
      newInventory[itemIndex] = {
        ...item,
        quantity: item.quantity - quantity,
      };
    } else {
      // Remove entire item
      newInventory.splice(itemIndex, 1);
    }

    set((state) => ({
      playerCharacter: {
        ...state.playerCharacter,
        inventory: newInventory,
      },
    }));

    get().updateInventoryCapacity();
    eventBus.emit("inventory.item.removed", {
      instanceId,
      quantity: quantity || item.quantity || 1,
    });

    return true;
  },

  moveItemInstance: (fromInstanceId: string, toSlot: string, toInstanceId?: string) => {
    const state = get();
    const fromItem = get().getItemInstanceById(fromInstanceId);

    if (!fromItem) {
      console.warn(`Source item ${fromInstanceId} not found`);
      return false;
    }

    // Handle different move scenarios
    if (toSlot === "inventory") {
      // Moving to inventory
      if (toInstanceId) {
        // Swapping with inventory item
        const toItem = get().getItemInstanceById(toInstanceId);
        if (!toItem) return false;

        const newInventory = state.playerCharacter.inventory.map((item) =>
          item.instanceId === toInstanceId ? fromItem : item
        );

        set((state) => ({
          playerCharacter: {
            ...state.playerCharacter,
            inventory: newInventory,
          },
        }));

        eventBus.emit("inventory.item.moved", {
          fromInstanceId,
          toSlot,
          toInstanceId,
        });

        return true;
      }
    }

    return false;
  },

  updateInventoryCapacity: () => {
    const state = get();
    const totalCapacity = state.playerCharacter.inventory.reduce((total, item) => {
      const itemData = ItemDictionary.getItem(item.templateId);
      const capacity = itemData?.capacity || 1;
      const quantity = item.quantity || 1;
      return total + capacity * quantity;
    }, 0);

    set((state) => ({
      playerCharacter: {
        ...state.playerCharacter,
        currentCapacity: totalCapacity,
      },
    }));

    eventBus.emit("inventory.capacity.changed", {
      current: totalCapacity,
      max: state.playerCharacter.maxCapacity,
    });
  },
});
