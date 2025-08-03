// src/services/ExperienceSystem.ts
import { eventBus } from "../utils/EventBus";
import { useGameStore } from "../stores/gameStore";
import { MonsterDictionary } from "./MonsterDictionaryService";
import { EXP_TABLE } from "../data/exp-table";

export interface ExperiencePopup {
  id: string;
  amount: number;
  x: number;
  y: number;
  timestamp: number;
}

class ExperienceSystemService {
  private activePopups: ExperiencePopup[] = [];
  private popupIdCounter = 0;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for monster death events
    eventBus.on("monster.died", this.handleMonsterKilled.bind(this));

    console.log("Experience System initialized");
  }

  /**
   * Calculate player level from total experience using EXP_TABLE
   * @param totalExperience - Total accumulated experience
   * @returns Object with level and experience progress
   */
  calculateLevelFromExperience(totalExperience: number): {
    level: number;
    currentExp: number;
    expForNextLevel: number;
  } {
    let level = 1;
    let expUsed = 0;

    // Find the highest level achievable with current experience
    for (let i = 0; i < EXP_TABLE.length; i++) {
      const expRequired = EXP_TABLE[i];

      if (totalExperience >= expRequired) {
        level = i + 1; // Array index + 1 = level
        expUsed = expRequired;
      } else {
        break;
      }
    }

    // Calculate current progress towards next level
    const currentExp = totalExperience - expUsed;
    const nextLevelIndex = level; // Next level is current level index in array
    const expForNextLevel =
      nextLevelIndex < EXP_TABLE.length ? EXP_TABLE[nextLevelIndex] - expUsed : 0;

    return {
      level,
      currentExp,
      expForNextLevel,
    };
  }

  /**
   * Get total experience required for a specific level
   * @param level - Target level (1-based)
   * @returns Total experience needed
   */
  getTotalExperienceForLevel(level: number): number {
    if (level <= 1) return 0;

    const tableIndex = level - 1; // Convert to 0-based index
    return tableIndex < EXP_TABLE.length ? EXP_TABLE[tableIndex] : EXP_TABLE[EXP_TABLE.length - 1];
  }

  /**
   * Handle monster killed event and award experience
   */
  private handleMonsterKilled(data: any): void {
    try {
      if (!data || !data.type) return;

      // Get experience reward for this monster type
      const expReward = MonsterDictionary.getExperienceReward(data.type);

      if (expReward > 0) {
        this.awardExperience(expReward, data.x, data.y);
      }
    } catch (error) {
      console.error("Error handling monster killed event:", error);
    }
  }

  /**
   * Award experience to the player and update all relevant systems
   * @param amount - Experience amount to award
   * @param x - X position for popup
   * @param y - Y position for popup
   */
  awardExperience(amount: number, x?: number, y?: number): void {
    try {
      if (amount <= 0) return;

      // Default popup position to center of screen if not provided
      const popupX = x ?? window.innerWidth / 2;
      const popupY = y ?? window.innerHeight / 2;

      // Get current player state
      const store = useGameStore.getState();
      const currentExperience = store.playerCharacter.experience;
      const newTotalExperience = currentExperience + amount;

      // Calculate level changes
      const currentLevelData = this.calculateLevelFromExperience(currentExperience);
      const newLevelData = this.calculateLevelFromExperience(newTotalExperience);

      // Update player experience in store
      store.updatePlayerExperience(newTotalExperience);

      // Show experience popup
      this.showExperiencePopup(amount, popupX, popupY);

      // Add message to message log
      eventBus.emit("ui.message.add", {
        type: "experience",
        text: `Gained ${amount} experience points!`,
      });

      // Check for level up
      if (newLevelData.level > currentLevelData.level) {
        // Update player level in store
        store.updatePlayerLevel(newLevelData.level);

        // Emit level up event
        eventBus.emit("player.levelup", {
          oldLevel: currentLevelData.level,
          newLevel: newLevelData.level,
          experience: newTotalExperience,
        });

        // Add level up message
        eventBus.emit("ui.message.add", {
          type: "levelup",
          text: `Congratulations! You are now level ${newLevelData.level}`,
        });
      }
    } catch (error) {
      console.error("Error awarding experience:", error);
    }
  }

  /**
   * Show floating experience number popup
   */
  private showExperiencePopup(amount: number, x: number, y: number): void {
    try {
      const popup: ExperiencePopup = {
        id: `exp-popup-${this.popupIdCounter++}`,
        amount,
        x,
        y,
        timestamp: Date.now(),
      };

      this.activePopups.push(popup);

      // Emit event for UI to render the popup
      eventBus.emit("experience.popup.show", popup);

      // Auto-remove popup after 3 seconds
      setTimeout(() => {
        this.removePopup(popup.id);
      }, 3000);
    } catch (error) {
      console.error("Error showing experience popup:", error);
    }
  }

  /**
   * Remove a popup by ID
   */
  private removePopup(popupId: string): void {
    const index = this.activePopups.findIndex((p) => p.id === popupId);
    if (index >= 0) {
      const popup = this.activePopups[index];
      this.activePopups.splice(index, 1);

      // Emit event for UI to remove the popup
      eventBus.emit("experience.popup.hide", popup);
    }
  }

  /**
   * Get current active popups (for UI rendering)
   */
  getActivePopups(): ExperiencePopup[] {
    return [...this.activePopups];
  }

  /**
   * Manually award experience (for testing or special events)
   */
  debugAwardExperience(amount: number): void {
    // Award experience at center of screen
    this.awardExperience(amount, window.innerWidth / 2, window.innerHeight / 2);
  }
}

// Create singleton instance
export const experienceSystem = new ExperienceSystemService();
