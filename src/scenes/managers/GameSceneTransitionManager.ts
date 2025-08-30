// src/scenes/managers/GameSceneTransitionManager.ts
import { eventBus } from "@/utils/EventBus";
import { MapService } from "@/services/MapService";
import { useGameStore } from "@/stores/gameStore";
import type { GameScene } from "../GameScene";

export class GameSceneTransitionManager {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  teleportPlayerInSameMap(destX: number, destY: number, message?: string): void {
    try {
      // Prevent multiple teleportations
      if (this.scene.isChangingMap) return;
      this.scene.isChangingMap = true;

      // Quick fade for visual feedback
      this.scene.cameras.main.fadeOut(150, 0, 0, 0);

      this.scene.cameras.main.once("camerafadeoutcomplete", () => {
        try {
          // Simply move the player to new position
          if (this.scene.playerCharacter) {
            this.scene.playerCharacter.setPosition(destX, destY);

            // Reset physics body to prevent collision issues
            if (this.scene.playerCharacter.body) {
              this.scene.playerCharacter.body.reset(destX, destY);
            }

            // Center camera on new position
            this.scene.cameras.main.centerOn(destX, destY);
          }

          // Show teleportation message
          if (message) {
            eventBus.emit("ui.message.show", message);
          }

          // Fade back in
          this.scene.cameras.main.fadeIn(150, 0, 0, 0);

          // Reset the flag when fade-in is complete
          this.scene.cameras.main.once("camerafadeincomplete", () => {
            this.scene.isChangingMap = false;
          });
        } catch (error) {
          console.error("Error during same-map teleportation:", error);
          this.scene.isChangingMap = false;
          eventBus.emit("ui.error.show", "Error during teleportation");
        }
      });
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.teleportPlayerInSameMap:", error);
      this.scene.isChangingMap = false;
      eventBus.emit("ui.error.show", "Error during teleportation");
    }
  }

  changeMap(mapKey: string, destX: number, destY: number, message?: string): void {
    try {
      // Prevent double transitions
      if (this.scene.isChangingMap) return;

      // Get current map from store
      const store = useGameStore.getState();
      const currentMap = store.currentMap;

      // Check if we're trying to "change" to the same map
      if (mapKey === currentMap) {
        this.teleportPlayerInSameMap(destX, destY, message);
        return;
      }

      // Original logic for actual map changes
      this.scene.isChangingMap = true;

      // Update the game state
      store.updatePlayerMap(mapKey);

      // Fade out camera
      this.scene.cameras.main.fadeOut(300, 0, 0, 0);

      this.scene.cameras.main.once("camerafadeoutcomplete", () => {
        try {
          // Cleanup current map resources
          this.cleanupForMapTransition();

          // Load the new map
          this.scene.mapManager.loadTiledMap();

          // Initialize chests for the new map
          this.scene.chestManager.initializeChests();

          // Set up new collisions
          this.scene.collisionManager.setupCollisions();

          // Re-initialize game systems for the new map
          this.scene.systemManager.reinitializeSystemsForNewMap();

          // Spawn initial content
          this.scene.entitySpawner.spawnInitialContent();

          // Reposition the player
          this.repositionPlayer(destX, destY);

          // Refresh UI components to ensure they're visible
          this.refreshUIComponents();

          // Fade back in
          this.scene.cameras.main.fadeIn(300, 0, 0, 0);

          // Reset the flag when fade-in is complete
          this.scene.cameras.main.once("camerafadeincomplete", () => {
            this.finalizeMapTransition(mapKey, message);
          });
        } catch (error) {
          console.error("Error during map transition:", error);
          this.scene.isChangingMap = false;
          eventBus.emit("ui.error.show", "Error during map transition");
        }
      });
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.changeMap:", error);
      this.scene.isChangingMap = false;
      eventBus.emit("ui.error.show", "Error changing map");
    }
  }

  private cleanupForMapTransition(): void {
    try {
      // Clean up chest timers before clearing states
      this.scene.chestManager.cleanup();

      // Clean up systems
      this.scene.systemManager.cleanup();

      // Cleanup current map resources
      this.scene.mapManager.cleanupCurrentMap();
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.cleanupForMapTransition:", error);
    }
  }

  private repositionPlayer(destX: number, destY: number): void {
    try {
      if (this.scene.playerCharacter) {
        this.scene.playerCharacter.setPosition(destX, destY);

        // Reset physics body to avoid any collision issues
        if (this.scene.playerCharacter.body) {
          this.scene.playerCharacter.body.reset(destX, destY);
        }

        // Center camera on player immediately to avoid jerky movement
        this.scene.cameras.main.centerOn(destX, destY);
      }
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.repositionPlayer:", error);
    }
  }

  private finalizeMapTransition(mapKey: string, message?: string): void {
    try {
      this.scene.isChangingMap = false;

      // Add notification about the location change
      const displayMessage = message || `Entered ${MapService.getMapName(mapKey)}`;
      eventBus.emit("ui.message.show", displayMessage);

      // Emit map changed event AFTER everything is set up
      eventBus.emit("map.changed", mapKey);

      // Finalize systems
      this.scene.systemManager.finalizeMapTransition();
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.finalizeMapTransition:", error);
    }
  }

  private refreshUIComponents(): void {
    try {
      // Refresh player character UI components
      if (
        this.scene.playerCharacter &&
        typeof this.scene.playerCharacter.refreshUIComponents === "function"
      ) {
        this.scene.playerCharacter.refreshUIComponents();
      }
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.refreshUIComponents:", error);
    }
  }

  cleanup(): void {
    try {
      // This manager doesn't have persistent resources to clean up
      // Cleanup is handled by individual operations
    } catch (error) {
      console.error("Error in GameSceneTransitionManager.cleanup:", error);
    }
  }
}
