// src/services/SpellSystem.ts
import { eventBus } from "../utils/EventBus";
import { SpellDictionary } from "../services/SpellDictionaryService";
import { SpellData } from "@/types";
import { useGameStore } from "@/stores/gameStore";

class SpellSystemService {
  private spellCooldowns: Record<string, number> = {}; // Tracks end time of cooldowns
  private activeSpells: Record<number, SpellData> = {}; // Spells assigned to action bar slots

  constructor() {
    // Subscribe to spell activation events
    eventBus.on("spell.activate", this.handleSpellActivation.bind(this));
    eventBus.on("spell.setForSlot", this.handleSetSpellForSlot.bind(this));
    eventBus.on("spell.clearSlot", this.handleClearSpell.bind(this));
  }

  /**
   * Handle spell activation requests
   */
  handleSpellActivation(data: any): void {
    if (!data || typeof data.slotIndex !== "number") return;

    this.castSpell(data.slotIndex);
  }

  /**
   * Handle setting spell for a specific slot
   */
  handleSetSpellForSlot(data: any): void {
    if (!data || !data.slotIndex || !data.spell) return;

    // Set the spell for the slot
    this.setSpellForSlot(data.slotIndex, data.spell);

    // Emit event to update UI components
    eventBus.emit("spell.activated", {
      slotIndex: data.slotIndex,
      spellId: data.spell.id,
      iconPath: data.spell.icon,
    });
  }

  /**
   * Handle clearing spell from slot
   */
  handleClearSpell(data: any): void {
    if (!data || !data.slotIndex) return;

    delete this.activeSpells[data.slotIndex - 1];
  }

  /**
   * Cast a spell from a specific slot
   */
  castSpell(slotIndex: number): void {
    const spell = this.activeSpells[slotIndex - 1];
    if (!spell) {
      console.warn(`No spell found in slot ${slotIndex}`);
      return;
    }

    // Check if player has learned this spell
    const gameStore = useGameStore.getState();
    if (!gameStore.isSpellLearned(spell.id)) {
      eventBus.emit("ui.message.show", `You haven't learned ${spell.name} yet`);
      return;
    }

    // Check cooldown
    const now = Date.now();
    if (this.spellCooldowns[spell.id] && now < this.spellCooldowns[spell.id]) {
      const remainingSeconds = Math.ceil((this.spellCooldowns[spell.id] - now) / 1000);
      eventBus.emit(
        "ui.message.show",
        `${spell.name} is on cooldown (${remainingSeconds}s remaining)`
      );
      return;
    }

    // Check mana cost (if implemented)
    if (spell.manaCost && spell.manaCost > 0) {
      // TODO: Implement mana checking when mana system is ready
      // For now, assume player has enough mana
    }

    // Execute the spell effect
    if (this.executeSpellEffect(spell)) {
      // Start cooldown
      this.spellCooldowns[spell.id] = now + spell.cooldown * 1000;

      // Update cooldown in game store
      gameStore.setSpellCooldown(spell.id, spell.cooldown);

      // Emit cooldown start event for UI
      eventBus.emit("spell.cooldown.start", {
        slotIndex: slotIndex,
        spellId: spell.id,
        duration: spell.cooldown,
      });

      // Emit spell cast event
      eventBus.emit("spell.cast", {
        spellId: spell.id,
        spellName: spell.name,
        slotIndex: slotIndex,
      });

      // Play animation if available
      this.playSpellAnimation(spell);

      eventBus.emit("ui.message.show", `Cast ${spell.name}!`);
    }
  }

  /**
   * Execute the actual spell effect
   */
  private executeSpellEffect(spell: SpellData): boolean {
    try {
      switch (spell.id) {
        case "lightHealing":
          return this.castLightHealing(spell);

        case "fireball":
          return this.castFireball(spell);

        case "battleCry":
          return this.castBattleCry(spell);

        case "multiShot":
          return this.castMultiShot(spell);

        default:
          console.warn(`No spell effect implemented for: ${spell.id}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing spell effect for ${spell.id}:`, error);
      eventBus.emit("ui.message.show", `Failed to cast ${spell.name}`);
      return false;
    }
  }

  /**
   * Light Healing spell effect
   */
  private castLightHealing(spell: SpellData): boolean {
    const gameStore = useGameStore.getState();
    const currentHealth = gameStore.playerCharacter.health;
    const calculatedStats = gameStore.calculatedStats;

    if (currentHealth >= calculatedStats.totalHealth) {
      eventBus.emit("ui.message.show", "You are already at full health");
      return false;
    }

    // Calculate healing amount
    const healingAmount = spell.healing || 10;
    const newHealth = Math.min(currentHealth + healingAmount, calculatedStats.totalHealth);
    const actualHealing = newHealth - currentHealth;

    // Apply healing
    gameStore.updatePlayerHealth(newHealth);

    // Show healing numbers
    eventBus.emit("healing.dealt", {
      amount: actualHealing,
      source: "spell",
      spellId: spell.id,
    });

    eventBus.emit("ui.message.show", `Healed for ${actualHealing} health`);
    return true;
  }

  /**
   * Fireball spell effect (placeholder)
   */
  private castFireball(spell: SpellData): boolean {
    // TODO: Implement fireball targeting and damage
    eventBus.emit("ui.message.show", `${spell.name} effect not yet implemented`);
    return true;
  }

  /**
   * Battle Cry spell effect (placeholder)
   */
  private castBattleCry(spell: SpellData): boolean {
    // TODO: Implement attack speed buff
    eventBus.emit("ui.message.show", `${spell.name} effect not yet implemented`);
    return true;
  }

  /**
   * Multi Shot spell effect (placeholder)
   */
  private castMultiShot(spell: SpellData): boolean {
    // TODO: Implement multi-shot arrow mechanics
    eventBus.emit("ui.message.show", `${spell.name} effect not yet implemented`);
    return true;
  }

  /**
   * Play spell animation
   */
  private playSpellAnimation(spell: SpellData): void {
    try {
      // TODO: Integrate with animation system when ready
      // For now, just emit an event that could be used by animation system
      eventBus.emit("spell.animation.play", {
        spellId: spell.id,
        animationType: spell.animationType,
        animationConfig: spell.animationConfig,
      });
    } catch (error) {
      console.error(`Error playing spell animation for ${spell.id}:`, error);
    }
  }

  /**
   * Set a spell for a specific action bar slot
   */
  setSpellForSlot(slotIndex: number, spell: SpellData): void {
    this.activeSpells[slotIndex - 1] = spell;
  }

  /**
   * Get spell assigned to a slot
   */
  getSpellForSlot(slotIndex: number): SpellData | null {
    return this.activeSpells[slotIndex - 1] || null;
  }

  /**
   * Check if a spell is on cooldown
   */
  isSpellOnCooldown(spellId: string): boolean {
    const now = Date.now();
    return Boolean(this.spellCooldowns[spellId] && now < this.spellCooldowns[spellId]);
  }

  /**
   * Get remaining cooldown time for a spell
   */
  getSpellCooldownRemaining(spellId: string): number {
    const now = Date.now();
    if (!this.spellCooldowns[spellId] || now >= this.spellCooldowns[spellId]) {
      return 0;
    }
    return Math.ceil((this.spellCooldowns[spellId] - now) / 1000);
  }

  /**
   * Get all active spells
   */
  getActiveSpells(): Record<number, SpellData> {
    return { ...this.activeSpells };
  }

  /**
   * Update system - called each frame to clean up expired cooldowns
   */
  update(): void {
    const now = Date.now();
    Object.keys(this.spellCooldowns).forEach((spellId) => {
      if (this.spellCooldowns[spellId] <= now) {
        delete this.spellCooldowns[spellId];
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Remove event listeners
    eventBus.off("spell.activate", this.handleSpellActivation);
    eventBus.off("spell.setForSlot", this.handleSetSpellForSlot);
    eventBus.off("spell.clearSlot", this.handleClearSpell);
  }
}

// Create and export singleton instance
export const spellSystem = new SpellSystemService();
