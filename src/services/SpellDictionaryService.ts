// src/services/SpellDictionaryService.ts
import { SpellData, SpellCategory, SpellTargetType } from "@/types";
import { eventBus } from "../utils/EventBus";

export interface ISpellDictionary {
  getSpell(spellId: string): SpellData | null;
  getAllSpells(): SpellData[];
  getSpellsByCategory(category: SpellCategory): SpellData[];
  isSpellLearned(spellId: string): boolean;
  learnSpell(spellId: string): boolean;
  getLearnedSpells(): SpellData[];
  syncLearnedSpells(learnedSpellIds: string[]): void;
}

class SpellDictionaryService implements ISpellDictionary {
  private spellDatabase: Record<string, SpellData> = {};
  private learnedSpells: Set<string> = new Set();

  constructor() {
    this.initializeSpells();
  }

  private initializeSpells(): void {
    try {
      // ===== GENERAL SPELLS =====
      this.spellDatabase.lightHealing = {
        id: "lightHealing",
        name: "Light Healing",
        description: "Restore 10 health instantly.",
        icon: "assets/spell-icons/light-healing.png",
        category: SpellCategory.GENERAL,
        cooldown: 3, // 3 seconds cooldown
        healing: 10, // Heals 10 health
        manaCost: 0, // No mana cost for now
        targetType: SpellTargetType.SELF,
        isInstant: true,
        animationType: "healing",
        animationConfig: {
          effectDuration: 1000,
          particleColors: [0x00ff00, 0x88ff88, 0xffffff], // Green healing colors
          targetSelf: true,
        },
      };

      // ===== WARRIOR SPELLS =====
      this.spellDatabase.battleCry = {
        id: "battleCry",
        name: "Battle Cry",
        description: "Unleash a mighty roar that increases attack speed for 10 seconds.",
        icon: "assets/spell-icons/battle-cry.png",
        category: SpellCategory.WARRIOR,
        cooldown: 15,
        manaCost: 5,
        duration: 10,
        targetType: SpellTargetType.SELF,
        isInstant: true,
        animationType: "buff",
        animationConfig: {
          effectDuration: 500,
          particleColors: [0xff4500, 0xff7700, 0xffaa00],
          targetSelf: true,
        },
      };

      this.spellDatabase.charge = {
        id: "charge",
        name: "Charge",
        description: "Rush forward, dealing damage to enemies in your path.",
        icon: "assets/spell-icons/charge.png",
        category: SpellCategory.WARRIOR,
        cooldown: 8,
        manaCost: 3,
        damage: 5,
        range: 120,
        targetType: SpellTargetType.TARGET,
        animationType: "directional",
        animationConfig: {
          effectDuration: 400,
          particleColors: [0xffcc00, 0xff9900],
          lineWidth: 4,
        },
      };

      // ===== MAGE SPELLS =====
      this.spellDatabase.fireball = {
        id: "fireball",
        name: "Fireball",
        description:
          "Launch a ball of fire that explodes on impact, dealing damage to nearby enemies.",
        icon: "assets/spell-icons/fireball.png",
        category: SpellCategory.MAGE,
        cooldown: 2,
        manaCost: 8,
        damage: 12,
        range: 200,
        areaSize: 64,
        targetType: SpellTargetType.GROUND,
        animationType: "projectile",
        animationConfig: {
          projectileSpeed: 250,
          explosionRadius: 64,
          particleColors: [0xff0000, 0xff7700, 0xffff00],
          effectDuration: 1000,
        },
      };

      this.spellDatabase.iceShield = {
        id: "iceShield",
        name: "Ice Shield",
        description: "Surround yourself with protective ice that absorbs damage for 15 seconds.",
        icon: "assets/spell-icons/ice-shield.png",
        category: SpellCategory.MAGE,
        cooldown: 20,
        manaCost: 12,
        duration: 15,
        targetType: SpellTargetType.SELF,
        animationType: "buff",
        animationConfig: {
          effectDuration: 800,
          particleColors: [0x87ceeb, 0x00aaff, 0xffffff],
          targetSelf: true,
        },
      };

      // ===== RANGER SPELLS =====
      this.spellDatabase.multiShot = {
        id: "multiShot",
        name: "Multi Shot",
        description: "Fire multiple arrows in a spread pattern, hitting several enemies.",
        icon: "assets/spell-icons/multi-shot.png",
        category: SpellCategory.RANGER,
        cooldown: 4,
        manaCost: 6,
        damage: 8,
        range: 180,
        targetType: SpellTargetType.TARGET,
        animationType: "multiProjectile",
        animationConfig: {
          projectileSpeed: 300,
          particleColors: [0x8b4513, 0xcd853f],
          effectDuration: 600,
        },
      };

      this.spellDatabase.animalFriend = {
        id: "animalFriend",
        name: "Animal Friend",
        description: "Summon a wolf companion to fight alongside you for 30 seconds.",
        icon: "assets/spell-icons/animal-friend.png",
        category: SpellCategory.RANGER,
        cooldown: 60,
        manaCost: 15,
        duration: 30,
        targetType: SpellTargetType.GROUND,
        isChanneled: false,
        animationType: "summon",
        animationConfig: {
          effectDuration: 1200,
          particleColors: [0x90ee90, 0x228b22, 0x006400],
        },
      };

      // Emit initialization event
      eventBus.emit("spellDictionary.initialized", {
        count: Object.keys(this.spellDatabase).length,
        categories: Object.values(SpellCategory).length,
      });

      console.log(
        `Initialized ${Object.keys(this.spellDatabase).length} spells across ${Object.values(SpellCategory).length} categories`
      );
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

  getSpellsByCategory(category: SpellCategory): SpellData[] {
    return Object.values(this.spellDatabase).filter((spell) => spell.category === category);
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

  // Helper method to get category display name
  getCategoryDisplayName(category: SpellCategory): string {
    const categoryNames = {
      [SpellCategory.GENERAL]: "General Spells",
      [SpellCategory.WARRIOR]: "Warrior Spells",
      [SpellCategory.MAGE]: "Mage Spells",
      [SpellCategory.RANGER]: "Ranger Spells",
    };

    return categoryNames[category] || category;
  }

  // Helper method to get all categories that have spells
  getAvailableCategories(): SpellCategory[] {
    const categories = new Set<SpellCategory>();
    Object.values(this.spellDatabase).forEach((spell) => {
      categories.add(spell.category);
    });
    return Array.from(categories).sort();
  }
}

// Create a singleton instance
export const SpellDictionary = new SpellDictionaryService();
