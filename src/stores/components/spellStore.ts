// src/stores/components/spellStore.ts
import { StateCreator } from "zustand";
import { SpellState, SpellCategory } from "@/types";
import { eventBus } from "../../utils/EventBus";
import { SpellDictionary } from "../../services/SpellDictionaryService";

// Initial spell state - user should know Light Healing by default for testing
const initialSpellState: SpellState = {
  learnedSpells: ["lightHealing"], // Default spell for testing
  spellCooldowns: {},
};

export interface SpellStore {
  // State
  spellState: SpellState;

  // Learned spells methods
  learnSpell: (spellId: string) => boolean;
  isSpellLearned: (spellId: string) => boolean;
  getLearnedSpells: () => string[];
  getLearnedSpellsByCategory: (category: SpellCategory) => string[];

  // Cooldown methods
  isSpellOnCooldown: (spellId: string) => boolean;
  getRemainingCooldown: (spellId: string) => number;
  setSpellCooldown: (spellId: string, cooldownSeconds: number) => void;
  clearSpellCooldown: (spellId: string) => void;
  updateCooldowns: () => void; // Called periodically to update cooldown states

  // Utility methods
  canCastSpell: (spellId: string) => boolean;
  getSpellsCount: () => number;
  hasAnySpells: () => boolean;
}

export const createSpellStore: StateCreator<any & SpellStore, [], [], SpellStore> = (set, get) => ({
  // Initial state
  spellState: initialSpellState,

  // Learn spell method
  learnSpell: (spellId: string) => {
    const currentState = get().spellState;

    // Check if spell exists in dictionary
    const spellData = SpellDictionary.getSpell(spellId);
    if (!spellData) {
      console.warn(`Attempted to learn unknown spell: ${spellId}`);
      return false;
    }

    // Check if already learned
    if (currentState.learnedSpells.includes(spellId)) {
      return false; // Already learned
    }

    // Add to learned spells
    set((state: any) => ({
      spellState: {
        ...state.spellState,
        learnedSpells: [...state.spellState.learnedSpells, spellId],
      },
    }));

    // Sync with spell dictionary
    SpellDictionary.syncLearnedSpells(get().spellState.learnedSpells);

    // Emit event
    eventBus.emit("spell.learned", {
      spellId,
      spellName: spellData.name,
      category: spellData.category,
    });

    console.log(`Learned spell: ${spellData.name} (${spellId})`);
    return true;
  },

  // Check if spell is learned
  isSpellLearned: (spellId: string) => {
    const currentState = get().spellState;
    return currentState.learnedSpells.includes(spellId);
  },

  // Get all learned spells
  getLearnedSpells: () => {
    const currentState = get().spellState;
    return [...currentState.learnedSpells];
  },

  // Get learned spells by category
  getLearnedSpellsByCategory: (category: SpellCategory) => {
    const currentState = get().spellState;
    return currentState.learnedSpells.filter((spellId: string) => {
      const spellData = SpellDictionary.getSpell(spellId);
      return spellData && spellData.category === category;
    });
  },

  // Cooldown methods
  isSpellOnCooldown: (spellId: string) => {
    const currentState = get().spellState;
    const cooldownExpiry = currentState.spellCooldowns[spellId];
    if (!cooldownExpiry) return false;

    return Date.now() < cooldownExpiry;
  },

  getRemainingCooldown: (spellId: string) => {
    const currentState = get().spellState;
    const cooldownExpiry = currentState.spellCooldowns[spellId];
    if (!cooldownExpiry) return 0;

    const remaining = Math.max(0, cooldownExpiry - Date.now());
    return Math.ceil(remaining / 1000); // Return in seconds
  },

  setSpellCooldown: (spellId: string, cooldownSeconds: number) => {
    const expiryTime = Date.now() + cooldownSeconds * 1000;

    set((state: any) => ({
      spellState: {
        ...state.spellState,
        spellCooldowns: {
          ...state.spellState.spellCooldowns,
          [spellId]: expiryTime,
        },
      },
    }));
  },

  clearSpellCooldown: (spellId: string) => {
    set((state: any) => {
      const newCooldowns = { ...state.spellState.spellCooldowns };
      delete newCooldowns[spellId];

      return {
        spellState: {
          ...state.spellState,
          spellCooldowns: newCooldowns,
        },
      };
    });
  },

  updateCooldowns: () => {
    const currentState = get().spellState;
    const currentTime = Date.now();
    const updatedCooldowns = { ...currentState.spellCooldowns };
    let hasExpiredCooldowns = false;

    // Remove expired cooldowns
    Object.keys(updatedCooldowns).forEach((spellId: string) => {
      if (updatedCooldowns[spellId] <= currentTime) {
        delete updatedCooldowns[spellId];
        hasExpiredCooldowns = true;
      }
    });

    // Update state if any cooldowns expired
    if (hasExpiredCooldowns) {
      set((state: any) => ({
        spellState: {
          ...state.spellState,
          spellCooldowns: updatedCooldowns,
        },
      }));
    }
  },

  // Utility methods
  canCastSpell: (spellId: string) => {
    const store = get();
    return store.isSpellLearned(spellId) && !store.isSpellOnCooldown(spellId);
  },

  getSpellsCount: () => {
    const currentState = get().spellState;
    return currentState.learnedSpells.length;
  },

  hasAnySpells: () => {
    const currentState = get().spellState;
    return currentState.learnedSpells.length > 0;
  },
});
