// src/stores/components/abilityStore.ts
import { StateCreator } from "zustand";
import { eventBus } from "../../utils/EventBus";
import { AbilityDictionary } from "../../services/AbilityDictionaryService";

const initialAbilityState = {
  learnedAbilities: [],
  abilityCooldowns: {} as Record<string, number>,
};

export interface AbilityStore {
  // State
  abilityState: typeof initialAbilityState;

  // Learned abilities methods
  learnAbility: (abilityId: string) => boolean;
  isAbilityLearned: (abilityId: string) => boolean;
  getLearnedAbilities: () => string[];

  // Cooldown methods
  isAbilityOnCooldown: (abilityId: string) => boolean;
  getRemainingCooldown: (abilityId: string) => number;
  setAbilityCooldown: (abilityId: string, cooldownSeconds: number) => void;
  clearAbilityCooldown: (abilityId: string) => void;
  updateCooldowns: () => void;

  // Utility methods
  canUseAbility: (abilityId: string) => boolean;
  getAbilitiesCount: () => number;
  hasAnyAbilities: () => boolean;
}

export const createAbilityStore: StateCreator<any & AbilityStore, [], [], AbilityStore> = (
  set,
  get
) => ({
  // Initial state
  abilityState: initialAbilityState,

  // Learn ability method
  learnAbility: (abilityId: string) => {
    const currentState = get().abilityState;

    // Check if ability exists in dictionary
    const abilityData = AbilityDictionary.getAbility(abilityId);
    if (!abilityData) {
      console.warn(`Attempted to learn unknown ability: ${abilityId}`);
      return false;
    }

    // Check if already learned
    if (currentState.learnedAbilities.includes(abilityId)) {
      return false; // Already learned
    }

    // Add to learned abilities
    set((state: any) => ({
      abilityState: {
        ...state.abilityState,
        learnedAbilities: [...state.abilityState.learnedAbilities, abilityId],
      },
    }));

    // Sync with ability dictionary
    AbilityDictionary.syncLearnedAbilities(get().abilityState.learnedAbilities);

    // Emit event
    eventBus.emit("ability.learned", {
      abilityId,
      abilityName: abilityData.name,
      weaponType: abilityData.weaponType,
    });

    console.log(`Learned ability: ${abilityData.name} (${abilityId})`);
    return true;
  },

  // Check if ability is learned
  isAbilityLearned: (abilityId: string) => {
    const currentState = get().abilityState;
    return currentState.learnedAbilities.includes(abilityId);
  },

  // Get all learned abilities
  getLearnedAbilities: () => {
    const currentState = get().abilityState;
    return [...currentState.learnedAbilities];
  },

  // Cooldown methods
  isAbilityOnCooldown: (abilityId: string) => {
    const currentState = get().abilityState;
    const cooldownExpiry = currentState.abilityCooldowns[abilityId];
    if (!cooldownExpiry) return false;

    return Date.now() < cooldownExpiry;
  },

  getRemainingCooldown: (abilityId: string) => {
    const currentState = get().abilityState;
    const cooldownExpiry = currentState.abilityCooldowns[abilityId];
    if (!cooldownExpiry) return 0;

    const remaining = Math.max(0, cooldownExpiry - Date.now());
    return Math.ceil(remaining / 1000); // Return in seconds
  },

  setAbilityCooldown: (abilityId: string, cooldownSeconds: number) => {
    const expiryTime = Date.now() + cooldownSeconds * 1000;

    set((state: any) => ({
      abilityState: {
        ...state.abilityState,
        abilityCooldowns: {
          ...state.abilityState.abilityCooldowns,
          [abilityId]: expiryTime,
        },
      },
    }));
  },

  clearAbilityCooldown: (abilityId: string) => {
    set((state: any) => {
      const newCooldowns = { ...state.abilityState.abilityCooldowns };
      delete newCooldowns[abilityId];

      return {
        abilityState: {
          ...state.abilityState,
          abilityCooldowns: newCooldowns,
        },
      };
    });
  },

  updateCooldowns: () => {
    const currentState = get().abilityState;
    const currentTime = Date.now();
    const updatedCooldowns = { ...currentState.abilityCooldowns };
    let hasExpiredCooldowns = false;

    // Remove expired cooldowns
    Object.keys(updatedCooldowns).forEach((abilityId: string) => {
      if (updatedCooldowns[abilityId] <= currentTime) {
        delete updatedCooldowns[abilityId];
        hasExpiredCooldowns = true;
      }
    });

    // Update state if any cooldowns expired
    if (hasExpiredCooldowns) {
      set((state: any) => ({
        abilityState: {
          ...state.abilityState,
          abilityCooldowns: updatedCooldowns,
        },
      }));
    }
  },

  // Utility methods
  canUseAbility: (abilityId: string) => {
    const store = get();
    return store.isAbilityLearned(abilityId) && !store.isAbilityOnCooldown(abilityId);
  },

  getAbilitiesCount: () => {
    const currentState = get().abilityState;
    return currentState.learnedAbilities.length;
  },

  hasAnyAbilities: () => {
    const currentState = get().abilityState;
    return currentState.learnedAbilities.length > 0;
  },
});
