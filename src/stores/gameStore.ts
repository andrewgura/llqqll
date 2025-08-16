// src/stores/gameStore.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GameState } from "./types/gameTypes";
import { EquipmentStore, createEquipmentStore } from "./components/equipmentStore";
import { InventoryStore, createInventoryStore } from "./components/inventoryStore";
import { PlayerStore, createPlayerStore } from "./components/playerStore";
import { QuestStore, createQuestStore } from "./components/questStore";
import { SkillsStore, createSkillsStore } from "./components/skillsStore";
import { SystemStore, createSystemStore } from "./components/systemStore";
import { UIStore, createUIStore } from "./components/uiStore";
import { createOutfitStore, OutfitStore } from "./components/outfitStore";

// Combined store type that includes all stores
export type GameStore = GameState &
  PlayerStore &
  InventoryStore &
  EquipmentStore &
  SkillsStore &
  QuestStore &
  UIStore &
  SystemStore &
  OutfitStore;

// Create the main game store by combining all stores
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get, store) => ({
    ...createPlayerStore(set, get, store),
    ...createInventoryStore(set, get, store),
    ...createEquipmentStore(set, get, store),
    ...createSkillsStore(set, get, store),
    ...createQuestStore(set, get, store),
    ...createUIStore(set, get, store),
    ...createSystemStore(set, get, store),
    ...createOutfitStore(set, get, store),
  }))
);
