import { StateCreator } from "zustand";

export interface CreatureKillData {
  monsterId: string;
  timesKilled: number;
  firstKillTimestamp?: number;
}

export interface CreatureStore {
  // State
  killedCreatures: Record<string, CreatureKillData>;

  // Actions
  recordCreatureKill: (monsterId: string) => void;
  getCreatureKillCount: (monsterId: string) => number;
  hasKilledCreature: (monsterId: string) => boolean;
  getKilledCreaturesList: () => CreatureKillData[];
  resetCreatureData: () => void;

  // Selectors
  getTotalKills: () => number;
  getUniqueCreaturesKilled: () => number;
}

export const createCreatureStore: StateCreator<CreatureStore, [], [], CreatureStore> = (
  set,
  get
) => ({
  // Initial state
  killedCreatures: {},

  // Actions
  recordCreatureKill: (monsterId: string) => {
    set((state) => {
      const existing = state.killedCreatures[monsterId];
      const now = Date.now();

      console.log(`Recording kill for monster: ${monsterId}`);

      return {
        killedCreatures: {
          ...state.killedCreatures,
          [monsterId]: {
            monsterId,
            timesKilled: existing ? existing.timesKilled + 1 : 1,
            firstKillTimestamp: existing?.firstKillTimestamp || now,
          },
        },
      };
    });
  },

  getCreatureKillCount: (monsterId: string) => {
    return get().killedCreatures[monsterId]?.timesKilled || 0;
  },

  hasKilledCreature: (monsterId: string) => {
    return (get().killedCreatures[monsterId]?.timesKilled || 0) > 0;
  },

  getKilledCreaturesList: () => {
    return Object.values(get().killedCreatures).filter((creature) => creature.timesKilled > 0);
  },

  resetCreatureData: () => {
    set({ killedCreatures: {} });
  },

  // Selectors
  getTotalKills: () => {
    return Object.values(get().killedCreatures).reduce(
      (total, creature) => total + creature.timesKilled,
      0
    );
  },

  getUniqueCreaturesKilled: () => {
    return Object.values(get().killedCreatures).filter((creature) => creature.timesKilled > 0)
      .length;
  },
});
