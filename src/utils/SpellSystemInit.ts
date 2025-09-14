// src/utils/SpellSystemInit.ts
import { spellSystem } from "../services/SpellSystem";
import { eventBus } from "./EventBus";

class SpellSystemInitializer {
  private initialized = false;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the spell system
   */
  initialize(): void {
    if (this.initialized) {
      console.warn("Spell system already initialized");
      return;
    }

    console.log("Initializing spell system...");

    // Start update loop for cooldowns
    this.startUpdateLoop();

    // Listen for game events that might affect spells
    this.setupEventListeners();

    this.initialized = true;
    console.log("Spell system initialized successfully");
  }

  /**
   * Start the update loop for spell cooldowns
   */
  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      spellSystem.update();
    }, 1000); // Update every second
  }

  /**
   * Setup event listeners for spell system
   */
  private setupEventListeners(): void {
    // Listen for player health updates to handle healing validation
    eventBus.on("playerCharacter.health.changed", (health) => {
      // Could be used for spell effects that depend on current health
    });

    // Listen for game pause/resume to pause spell cooldowns
    eventBus.on("game.paused", () => {
      // Pause spell system if needed
    });

    eventBus.on("game.resumed", () => {
      // Resume spell system if needed
    });

    // Listen for scene changes to clean up spell effects
    eventBus.on("scene.changed", () => {
      // Clean up any active spell animations
    });
  }

  /**
   * Destroy and clean up the spell system
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Clean up spell system
    spellSystem.destroy();

    // Remove event listeners
    eventBus.off("playerCharacter.health.changed", () => {});
    eventBus.off("game.paused", () => {});
    eventBus.off("game.resumed", () => {});
    eventBus.off("scene.changed", () => {});

    this.initialized = false;
    console.log("Spell system destroyed");
  }
}

// Create and export singleton instance
export const spellSystemInitializer = new SpellSystemInitializer();
