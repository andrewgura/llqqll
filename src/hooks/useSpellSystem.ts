// src/hooks/useSpellSystem.ts
import { useState, useEffect, useCallback } from "react";
import { useEventBus } from "./useEventBus";
import { spellSystem } from "../services/SpellSystem";
import { SpellData } from "@/types";
import { useGameStore } from "@/stores/gameStore";

export function useSpellSystem() {
  const [activeSpells, setActiveSpells] = useState<Record<number, SpellData>>(
    spellSystem.getActiveSpells()
  );
  const [cooldowns, setCooldowns] = useState<Record<number, { end: number; duration: number }>>({});

  // Get spell store functions
  const { isSpellOnCooldown, getRemainingCooldown } = useGameStore();

  // Listen for spell updates
  useEventBus("spell.activated", (data) => {
    if (data) {
      setActiveSpells(spellSystem.getActiveSpells());
    }
  });

  // Listen for cooldown start events
  useEventBus("spell.cooldown.start", (data) => {
    if (data && data.slotIndex !== undefined && data.duration) {
      setCooldowns((prev) => ({
        ...prev,
        [data.slotIndex]: {
          end: Date.now() + data.duration * 1000,
          duration: data.duration * 1000,
        },
      }));
    }
  });

  // Update cooldowns periodically
  useEffect(() => {
    const updateCooldowns = () => {
      const now = Date.now();
      let cooldownsChanged = false;

      const updatedCooldowns = { ...cooldowns };

      Object.entries(updatedCooldowns).forEach(([slotIndexStr, cooldownData]) => {
        const slotIndex = parseInt(slotIndexStr);
        if (now >= cooldownData.end) {
          delete updatedCooldowns[slotIndex];
          cooldownsChanged = true;
        }
      });

      if (cooldownsChanged) {
        setCooldowns(updatedCooldowns);
      }
    };

    const interval = setInterval(updateCooldowns, 100);
    return () => clearInterval(interval);
  }, [cooldowns]);

  // Cast spell method
  const castSpell = useCallback((slotIndex: number) => {
    spellSystem.castSpell(slotIndex);
  }, []);

  // Check if a spell in a slot is on cooldown
  const isSpellSlotOnCooldown = useCallback(
    (slotIndex: number): boolean => {
      const spell = activeSpells[slotIndex];
      if (!spell) return false;

      // Check both local cooldowns and game store cooldowns
      return (
        Boolean(cooldowns[slotIndex + 1] && Date.now() < cooldowns[slotIndex + 1].end) ||
        isSpellOnCooldown(spell.id)
      );
    },
    [cooldowns, activeSpells, isSpellOnCooldown]
  );

  // Get cooldown percentage for a spell slot
  const getSpellCooldownPercentage = useCallback(
    (slotIndex: number): number => {
      const spell = activeSpells[slotIndex];
      if (!spell) return 0;

      // Check local cooldowns first
      if (cooldowns[slotIndex + 1] && Date.now() < cooldowns[slotIndex + 1].end) {
        const timeLeft = cooldowns[slotIndex + 1].end - Date.now();
        const percentage = (timeLeft / cooldowns[slotIndex + 1].duration) * 100;
        return Math.max(0, Math.min(100, percentage));
      }

      // Check game store cooldowns
      if (isSpellOnCooldown(spell.id)) {
        const remaining = getRemainingCooldown(spell.id);
        const total = spell.cooldown;
        if (total > 0) {
          const percentage = (remaining / total) * 100;
          return Math.max(0, Math.min(100, percentage));
        }
      }

      return 0;
    },
    [cooldowns, activeSpells, isSpellOnCooldown, getRemainingCooldown]
  );

  // Get cooldown remaining in seconds for a spell slot
  const getSpellCooldownRemaining = useCallback(
    (slotIndex: number): number => {
      const spell = activeSpells[slotIndex];
      if (!spell) return 0;

      // Check local cooldowns first
      if (cooldowns[slotIndex + 1] && Date.now() < cooldowns[slotIndex + 1].end) {
        return Math.ceil((cooldowns[slotIndex + 1].end - Date.now()) / 1000);
      }

      // Check game store cooldowns
      if (isSpellOnCooldown(spell.id)) {
        return getRemainingCooldown(spell.id);
      }

      return 0;
    },
    [cooldowns, activeSpells, isSpellOnCooldown, getRemainingCooldown]
  );

  // Set spell for slot
  const setSpellForSlot = useCallback((slotIndex: number, spell: SpellData) => {
    spellSystem.setSpellForSlot(slotIndex, spell);
    setActiveSpells(spellSystem.getActiveSpells());
  }, []);

  // Get spell for slot
  const getSpellForSlot = useCallback((slotIndex: number): SpellData | null => {
    return spellSystem.getSpellForSlot(slotIndex);
  }, []);

  // Check if slot has a spell
  const hasSpellInSlot = useCallback(
    (slotIndex: number): boolean => {
      return Boolean(activeSpells[slotIndex]);
    },
    [activeSpells]
  );

  return {
    activeSpells,
    castSpell,
    isSpellSlotOnCooldown,
    getSpellCooldownPercentage,
    getSpellCooldownRemaining,
    setSpellForSlot,
    getSpellForSlot,
    hasSpellInSlot,
  };
}
