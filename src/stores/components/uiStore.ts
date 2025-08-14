// src/stores/stores/uiStore.ts
import { StateCreator } from "zustand";
import { GameState } from "../types/gameTypes";
import { SetCollectionData } from "../../types";

export interface UIStore {
  // UI state
  inputFocused: boolean;
  setCollections: SetCollectionData;

  // UI methods
  setInputFocused: (focused: boolean) => void;
  updateSetCollections: (collections: SetCollectionData) => void;
}

export const createUIStore: StateCreator<GameState & UIStore, [], [], UIStore> = (set, get) => ({
  // Initial state
  inputFocused: false,
  setCollections: {},

  setInputFocused: (focused: boolean) => {
    set({ inputFocused: focused });
  },

  updateSetCollections: (collections: SetCollectionData) => {
    set({ setCollections: collections });
  },
});
