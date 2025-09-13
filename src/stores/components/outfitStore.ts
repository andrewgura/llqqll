import { StateCreator } from "zustand";
import { eventBus } from "../../utils/EventBus";
import { GameState, OutfitData, OutfitState } from "@/types";

export interface OutfitStore {
  // State
  outfitState: OutfitState;

  // Actions
  setCurrentOutfit: (outfitId: string) => void;
  setCurrentTint: (tint: number) => void;
  unlockOutfit: (outfitId: string) => void;
  isOutfitUnlocked: (outfitId: string) => boolean;
  getUnlockedOutfits: () => OutfitData[];
  getCurrentOutfitData: () => OutfitData | null;
}

// Default outfits available in the game
const DEFAULT_OUTFITS: Record<string, OutfitData> = {
  default: {
    id: "default",
    name: "Adventurer",
    sprite: "playerCharacter",
    description: "The classic adventurer look. Simple but reliable.",
    isUnlocked: true,
    isDefault: true,
    unlockSource: "default",
    previewImage: "assets/outfit-preview/default-outfit-preview.png",
  },
  skeleton: {
    id: "skeleton",
    name: "Skeleton",
    sprite: "skeleton", // Will need to be loaded in BootScene
    description: "A fearsome skeletal appearance that strikes fear into enemies.",
    isUnlocked: false,
    unlockSource: "skeletal_set",
    previewImage: "assets/outfit-preview/skeleton-outfit-preview.png",
  },
  // Future outfits can be added here
};

const initialOutfitState: OutfitState = {
  currentOutfit: "default",
  currentTint: 0xffffff, // White (no tint)
  availableOutfits: DEFAULT_OUTFITS,
  unlockedOutfitIds: ["default"], // Default outfit is always unlocked
};

export const createOutfitStore: StateCreator<GameState & OutfitStore, [], [], OutfitStore> = (
  set,
  get
) => ({
  // Initial state
  outfitState: initialOutfitState,

  // Set current outfit
  setCurrentOutfit: (outfitId: string) => {
    const state = get();
    const outfit = state.outfitState.availableOutfits[outfitId];

    if (!outfit) {
      console.warn(`Outfit ${outfitId} not found`);
      return;
    }

    if (!state.isOutfitUnlocked(outfitId)) {
      console.warn(`Outfit ${outfitId} is not unlocked`);
      eventBus.emit("ui.message.show", `${outfit.name} is not unlocked yet!`);
      return;
    }

    set((state) => ({
      outfitState: {
        ...state.outfitState,
        currentOutfit: outfitId,
      },
    }));

    // Emit outfit change event for PlayerCharacter to listen to
    eventBus.emit("outfit.changed", {
      outfitId,
      sprite: outfit.sprite,
      tint: state.outfitState.currentTint,
    });

    eventBus.emit("ui.message.show", `Changed outfit to ${outfit.name}`);
  },

  // Set current tint color
  setCurrentTint: (tint: number) => {
    const state = get();

    set((state) => ({
      outfitState: {
        ...state.outfitState,
        currentTint: tint,
      },
    }));

    // Emit tint change event
    const currentOutfitData = state.getCurrentOutfitData();
    if (currentOutfitData) {
      eventBus.emit("outfit.changed", {
        outfitId: state.outfitState.currentOutfit,
        sprite: currentOutfitData.sprite,
        tint: tint,
      });
    }
  },

  // Unlock an outfit
  unlockOutfit: (outfitId: string) => {
    const state = get();
    const outfit = state.outfitState.availableOutfits[outfitId];

    if (!outfit) {
      console.warn(`Outfit ${outfitId} not found`);
      return;
    }

    if (state.outfitState.unlockedOutfitIds.includes(outfitId)) {
      return;
    }

    set((state) => ({
      outfitState: {
        ...state.outfitState,
        unlockedOutfitIds: [...state.outfitState.unlockedOutfitIds, outfitId],
        availableOutfits: {
          ...state.outfitState.availableOutfits,
          [outfitId]: {
            ...outfit,
            isUnlocked: true,
          },
        },
      },
    }));

    eventBus.emit("outfit.unlocked", { outfitId, outfit });
    eventBus.emit("ui.message.show", `🎉 Unlocked ${outfit.name} outfit!`);
  },

  // Check if outfit is unlocked
  isOutfitUnlocked: (outfitId: string) => {
    const state = get();
    return state.outfitState.unlockedOutfitIds.includes(outfitId);
  },

  // Get all unlocked outfits
  getUnlockedOutfits: () => {
    const state = get();
    return state.outfitState.unlockedOutfitIds
      .map((id) => state.outfitState.availableOutfits[id])
      .filter((outfit) => outfit !== undefined);
  },

  // Get current outfit data
  getCurrentOutfitData: () => {
    const state = get();
    return state.outfitState.availableOutfits[state.outfitState.currentOutfit] || null;
  },
});
