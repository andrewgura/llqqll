import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { EquipmentStore, createEquipmentStore } from "./components/equipmentStore";
import { InventoryStore, createInventoryStore } from "./components/inventoryStore";
import { PlayerStore, createPlayerStore } from "./components/playerStore";
import { QuestStore, createQuestStore } from "./components/questStore";
import { SkillsStore, createSkillsStore } from "./components/skillsStore";
import { SystemStore, createSystemStore } from "./components/systemStore";
import { UIStore, createUIStore } from "./components/uiStore";
import { createOutfitStore, OutfitStore } from "./components/outfitStore";
import { createCreatureStore, CreatureStore } from "./components/creatureStore";
import { createAbilityStore, AbilityStore } from "./components/abilityStore"; // CHANGED: from spellStore to abilityStore
import { GameState } from "@/types";

// Combined store type that includes all stores
export type GameStore = GameState &
  PlayerStore &
  InventoryStore &
  EquipmentStore &
  SkillsStore &
  QuestStore &
  UIStore &
  SystemStore &
  OutfitStore &
  CreatureStore &
  AbilityStore; // CHANGED: from SpellStore to AbilityStore

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
    ...createCreatureStore(set, get, store),
    ...createAbilityStore(set, get, store), // CHANGED: from createSpellStore to createAbilityStore
  }))
);
