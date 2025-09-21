// src/services/AbilityDictionaryService.ts
import { Ability } from "@/types";
import { eventBus } from "../utils/EventBus";

export interface IAbilityDictionary {
  getAbility(abilityId: string): Ability | null;
  getAllAbilities(): Ability[];
  getAbilitiesByWeaponType(weaponType: string): Ability[];
  getLearnedAbilities(): Ability[];
  isAbilityLearned(abilityId: string): boolean;
  learnAbility(abilityId: string): boolean;
  syncLearnedAbilities(learnedAbilityIds: string[]): void;
}

class AbilityDictionaryService implements IAbilityDictionary {
  private abilityDatabase: Record<string, Ability> = {};
  private learnedAbilities: Set<string> = new Set();

  constructor() {
    this.initializeAbilities();
  }

  private initializeAbilities(): void {
    try {
      // ===== GENERAL ABILITIES (formerly spells) =====

      // Light Healing - available to all classes
      this.abilityDatabase.lightHealing = {
        id: "lightHealing",
        name: "Light Healing",
        description: "Restore 10 health instantly.",
        icon: "assets/spell-icons/light-healing.png",
        cooldown: 3, // 3 seconds cooldown
        damage: 0,
        weaponType: "general", // Special type for learned abilities
        requiredWeapon: "any",
        skillId: "general",
        healing: 10, // Add healing property
        range: 0, // Self-cast
        areaSize: 0,
        animationType: "healing",
        animationConfig: {
          effectDuration: 1000,
          particleColors: [0x00ff00, 0x88ff88, 0xffffff], // Green healing colors
          targetSelf: true,
        },
      };

      // ===== MELEE ABILITIES =====

      // Basic sword slash
      this.abilityDatabase.swordSlash = {
        id: "swordSlash",
        name: "Sword Slash",
        description: "A powerful melee attack that deals damage to enemies in front of you.",
        icon: "assets/ability-icons/sword-slash.png",
        cooldown: 0.5,
        damage: 10,
        weaponType: "melee",
        requiredWeapon: "any",
        skillId: "melee",
        range: 60,
        areaSize: 90,
        animationType: "directional",
        animationConfig: {
          effectDuration: 300,
          particleColors: [0xffff00, 0xff9900],
          arcAngle: 90,
        },
      };

      // Whirlwind attack
      this.abilityDatabase.whirlwind = {
        id: "whirlwind",
        name: "Whirlwind",
        description: "Spin in a circle, dealing damage to all nearby enemies.",
        icon: "assets/ability-icons/whirlwind.png",
        cooldown: 3,
        damage: 8,
        weaponType: "melee",
        requiredWeapon: "any",
        skillId: "melee",
        range: 70,
        areaSize: 360,
        animationType: "area",
        animationConfig: {
          effectDuration: 800,
          particleColors: [0x00ffff, 0x0099ff],
          startRadius: 10,
          endRadius: 70,
          expansionTime: 300,
        },
      };

      // Bash attack
      this.abilityDatabase.bash = {
        id: "bash",
        name: "Bash",
        description: "A heavy attack that deals massive damage to a single target.",
        icon: "assets/ability-icons/bash.png",
        cooldown: 4,
        damage: 20,
        weaponType: "melee",
        requiredWeapon: "any",
        skillId: "melee",
        range: 60,
        areaSize: 45,
        animationType: "directional",
        animationConfig: {
          effectDuration: 400,
          particleColors: [0xff4400, 0xff7700],
          arcAngle: 45,
        },
      };

      // ===== ARCHERY ABILITIES =====

      // Power Shot
      this.abilityDatabase.powerShot = {
        id: "powerShot",
        name: "Power Shot",
        description: "Fire a powerful arrow that pierces through enemies.",
        icon: "assets/ability-icons/power-shot.png",
        cooldown: 2,
        damage: 15,
        weaponType: "archery",
        requiredWeapon: "any",
        skillId: "archery",
        range: 200,
        areaSize: 20,
        animationType: "projectile",
        animationConfig: {
          effectDuration: 600,
          particleColors: [0xffff00, 0xffa500],
          projectileSpeed: 300,
          lineWidth: 4,
        },
      };

      // Focus
      this.abilityDatabase.focus = {
        id: "focus",
        name: "Focus",
        description: "Increase accuracy and critical hit chance for a short time.",
        icon: "assets/ability-icons/focus.png",
        cooldown: 8,
        damage: 0,
        weaponType: "archery",
        requiredWeapon: "any",
        skillId: "archery",
        range: 0,
        areaSize: 0,
        animationType: "buff",
        animationConfig: {
          effectDuration: 500,
          particleColors: [0x00ff00, 0x88ff88],
          targetSelf: true,
        },
      };

      // Rain of Arrows
      this.abilityDatabase.rainOfArrows = {
        id: "rainOfArrows",
        name: "Rain of Arrows",
        description: "Fire multiple arrows in a spread pattern.",
        icon: "assets/ability-icons/rain-of-arrows.png",
        cooldown: 6,
        damage: 6,
        weaponType: "archery",
        requiredWeapon: "any",
        skillId: "archery",
        range: 180,
        areaSize: 120,
        animationType: "multiProjectile",
        animationConfig: {
          effectDuration: 800,
          particleColors: [0x8899ff, 0x6677cc],
          particleCount: 5,
          projectileSpeed: 250,
        },
      };

      // ===== MAGIC ABILITIES =====

      // Fireball
      this.abilityDatabase.fireball = {
        id: "fireball",
        name: "Fireball",
        description: "Launch a ball of fire that explodes on impact.",
        icon: "assets/ability-icons/fireball.png",
        cooldown: 3,
        damage: 12,
        weaponType: "magic",
        requiredWeapon: "any",
        skillId: "magic",
        range: 150,
        areaSize: 60,
        animationType: "projectileExplosion",
        animationConfig: {
          effectDuration: 1000,
          particleColors: [0xff4400, 0xff7700, 0xffaa00],
          projectileSpeed: 200,
          explosionRadius: 30,
        },
      };

      // Energy Wave
      this.abilityDatabase.energyWave = {
        id: "energyWave",
        name: "Energy Wave",
        description: "Send out a wave of energy that damages enemies in a line.",
        icon: "assets/ability-icons/energy-wave.png",
        cooldown: 4,
        damage: 10,
        weaponType: "magic",
        requiredWeapon: "any",
        skillId: "magic",
        range: 120,
        areaSize: 80,
        animationType: "wave",
        animationConfig: {
          effectDuration: 600,
          particleColors: [0x00ffff, 0x0088ff],
          wallLength: 80,
          wallWidth: 10,
        },
      };

      // Fire Wall
      this.abilityDatabase.fireWall = {
        id: "fireWall",
        name: "Fire Wall",
        description: "Create a wall of fire that damages enemies who walk through it.",
        icon: "assets/ability-icons/fire-wall.png",
        cooldown: 8,
        damage: 5,
        weaponType: "magic",
        requiredWeapon: "any",
        skillId: "magic",
        range: 100,
        areaSize: 80,
        animationType: "wall",
        animationConfig: {
          effectDuration: 2000,
          particleColors: [0xff4400, 0xff7700, 0xffaa00],
          wallLength: 80,
          wallWidth: 15,
        },
      };

      console.log(
        "Ability dictionary initialized with",
        Object.keys(this.abilityDatabase).length,
        "abilities"
      );
    } catch (error) {
      console.error("Failed to initialize ability dictionary:", error);
    }
  }

  getAbility(abilityId: string): Ability | null {
    return this.abilityDatabase[abilityId] || null;
  }

  getAllAbilities(): Ability[] {
    return Object.values(this.abilityDatabase);
  }

  getAbilitiesByWeaponType(weaponType: string): Ability[] {
    return Object.values(this.abilityDatabase).filter(
      (ability) => ability.weaponType === weaponType
    );
  }

  getLearnedAbilities(): Ability[] {
    return Array.from(this.learnedAbilities)
      .map((abilityId) => this.getAbility(abilityId))
      .filter((ability): ability is Ability => ability !== null);
  }

  isAbilityLearned(abilityId: string): boolean {
    return this.learnedAbilities.has(abilityId);
  }

  learnAbility(abilityId: string): boolean {
    const ability = this.getAbility(abilityId);
    if (!ability) {
      console.warn(`Attempted to learn unknown ability: ${abilityId}`);
      return false;
    }

    if (this.learnedAbilities.has(abilityId)) {
      return false; // Already learned
    }

    this.learnedAbilities.add(abilityId);

    // Emit event
    eventBus.emit("ability.learned", {
      abilityId,
      abilityName: ability.name,
      weaponType: ability.weaponType,
    });

    console.log(`Learned ability: ${ability.name} (${abilityId})`);
    return true;
  }

  syncLearnedAbilities(learnedAbilityIds: string[]): void {
    this.learnedAbilities.clear();
    learnedAbilityIds.forEach((abilityId) => {
      if (this.abilityDatabase[abilityId]) {
        this.learnedAbilities.add(abilityId);
      }
    });
  }
}

// Create and export singleton instance
export const AbilityDictionary = new AbilityDictionaryService();
