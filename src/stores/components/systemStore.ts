// src/stores/stores/systemStore.ts
import { StateCreator } from "zustand";
import { GameState } from "../types/gameTypes";

export interface SystemStore {
  // System state
  systems?: Record<string, any>;

  // System methods
  registerSystem: (name: string, system: any) => void;
  getSystem: (name: string) => any;
  unregisterSystem: (name: string) => void;
}

export const createSystemStore: StateCreator<GameState & SystemStore, [], [], SystemStore> = (
  set,
  get
) => ({
  // Initial state
  systems: {},

  registerSystem: (name: string, system: any) => {
    set((state) => ({
      systems: {
        ...state.systems,
        [name]: system,
      },
    }));
  },

  getSystem: (name: string) => {
    const state = get();
    return state.systems?.[name];
  },

  unregisterSystem: (name: string) => {
    set((state) => {
      if (!state.systems) return state;

      const { [name]: removed, ...remainingSystems } = state.systems;
      return {
        systems: remainingSystems,
      };
    });
  },
});
