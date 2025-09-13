import { SpellData } from "@/types";
import { eventBus } from "../utils/EventBus";

export interface ISpellDictionary {
  getSpell(spellId: string): SpellData | null;
  getAllSpells(): SpellData[];
  isSpellLearned(spellId: string): boolean;
  learnSpell(spellId: string): boolean;
  getLearnedSpells(): SpellData[];
}

class SpellDictionaryService implements ISpellDictionary {
  private spellDatabase: Record<string, SpellData> = {};
  private learnedSpells: Set<string> = new Set();

  constructor() {
    this.initializeSpells();
  }

  private initializeSpells(): void {
    try {
      // Light Healing Spell
      this.spellDatabase.lightHealing = {
        id: "lightHealing",
        name: "Light Healing",
        description: "Restore 10 health instantly.",
        icon: "assets/spell-icons/light-healing.png",
        cooldown: 3, // 3 seconds cooldown as required
        healing: 10, // Heals 10 health as required
        manaCost: 0, // No mana cost for now
        animationType: "healing",
        animationConfig: {
          effectDuration: 1000,
          particleColors: [0x00ff00, 0x88ff88, 0xffffff], // Green healing colors
          targetSelf: true, // This spell targets the caster
        },
      };

      // Future spells can be added here

      // Emit initialization event
      eventBus.emit("spellDictionary.initialized", {
        count: Object.keys(this.spellDatabase).length,
      });
    } catch (error) {
      console.error("Error initializing spells:", error);
    }
  }

  getSpell(spellId: string): SpellData | null {
    return this.spellDatabase[spellId] || null;
  }

  getAllSpells(): SpellData[] {
    return Object.values(this.spellDatabase);
  }

  isSpellLearned(spellId: string): boolean {
    return this.learnedSpells.has(spellId);
  }

  learnSpell(spellId: string): boolean {
    if (this.spellDatabase[spellId] && !this.learnedSpells.has(spellId)) {
      this.learnedSpells.add(spellId);
      eventBus.emit("spell.learned", { spellId });
      return true;
    }
    return false;
  }

  getLearnedSpells(): SpellData[] {
    return Array.from(this.learnedSpells)
      .map((spellId) => this.spellDatabase[spellId])
      .filter((spell) => spell !== undefined);
  }

  // Method to sync with game store
  syncLearnedSpells(learnedSpellIds: string[]): void {
    this.learnedSpells = new Set(learnedSpellIds);
  }
}

// Create a singleton instance
export const SpellDictionary = new SpellDictionaryService();
