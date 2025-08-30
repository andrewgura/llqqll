// src/scenes/managers/GameSceneChestManager.ts
import { eventBus } from "@/utils/EventBus";
import { MapService } from "@/services/MapService";
import { useGameStore } from "@/stores/gameStore";
import { Chest } from "@/entities/Chest";
import { ChestLootTables } from "@/data/chest-loot-tables";
import type { GameScene } from "../GameScene";

// Chest state interface
interface ChestState {
  id: string;
  isOpen: boolean;
  lootTable: string;
  respawnTime: number;
  chestSprite: Chest;
  x: number;
  y: number;
  chestType: string;
  respawnTimer?: Phaser.Time.TimerEvent;
}

export class GameSceneChestManager {
  private scene: GameScene;
  private chestStates: Map<string, ChestState> = new Map();

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  initializeChests(): void {
    try {
      if (!this.scene.interactLayer) {
        console.warn("No interact layer found for chest initialization");
        return;
      }

      // Clear existing chest states
      this.chestStates.clear();

      const store = useGameStore.getState();
      const currentMap = store.currentMap;

      // Find all chest interaction objects and spawn them as sprites
      this.scene.interactLayer.objects.forEach((obj: any) => {
        if (obj.properties && obj.x !== undefined && obj.y !== undefined) {
          let chestId = "";
          let lootTable = "default";
          let respawnTime = 300;
          let chestType = "chest-good"; // Changed default from "chest-closed"

          // Parse properties
          obj.properties.forEach((prop: any) => {
            if (prop.name === "id") chestId = prop.value;
            if (prop.name === "lootTable") lootTable = prop.value;
            if (prop.name === "respawnTime") respawnTime = parseInt(prop.value, 10) || 300;
            if (prop.name === "chestType") chestType = prop.value;
          });

          // If this object has a chest ID, spawn a chest sprite
          if (chestId) {
            // Better coordinate conversion for Tiled objects
            // Tiled objects have their origin at top-left, but we want center positioning
            const objCenterX = obj.x + (obj.width || 32) / 2;
            const objCenterY = obj.y + (obj.height || 32) / 2;

            // Convert pixel coordinates to tile coordinates
            const tileX = Math.floor(objCenterX / 32);
            const tileY = Math.floor(objCenterY / 32);

            // Use MapService to convert tile coordinates to proper Phaser world coordinates
            const phaserCoords = MapService.tiledToPhaser(currentMap, tileX, tileY);

            const chest = this.spawnChest(
              chestId,
              phaserCoords.x,
              phaserCoords.y,
              lootTable,
              respawnTime,
              chestType
            );

            if (chest) {
              // Store the tile coordinates in the chest for interaction checking
              (chest as any).tileX = tileX;
              (chest as any).tileY = tileY;
            }
          }
        }
      });
    } catch (error) {
      console.error("Error in GameSceneChestManager.initializeChests:", error);
    }
  }

  spawnChest(
    chestId: string,
    x: number,
    y: number,
    lootTable: string = "default",
    respawnTime: number = 300,
    chestType: string = "chest-good"
  ): Chest | null {
    try {
      // Check if chest with this ID already exists
      const existingChest = Array.from(this.chestStates.values()).find(
        (state) => state.id === chestId
      );

      if (existingChest) {
        console.warn(`Chest with ID ${chestId} already exists, skipping spawn`);
        return existingChest.chestSprite;
      }

      // Create the chest entity with the chestType parameter
      const chest = new Chest(this.scene, x, y, chestId, lootTable, respawnTime, chestType);

      // Add to chests group
      this.scene.chests.add(chest);

      // Create chest state for tracking
      const chestState: ChestState = {
        id: chestId,
        isOpen: false,
        lootTable,
        respawnTime,
        chestSprite: chest,
        x: x,
        y: y,
        chestType: chestType,
      };

      this.chestStates.set(chestId, chestState);

      return chest;
    } catch (error) {
      console.error("Error in GameSceneChestManager.spawnChest:", error);
      return null;
    }
  }

  openChest(chest: Chest): boolean {
    const chestState = Array.from(this.chestStates.values()).find(
      (state) => state.chestSprite === chest
    );

    if (!chestState || chestState.isOpen) {
      return false;
    }

    try {
      // Mark chest as open
      chestState.isOpen = true;

      // Use the new chest method to handle opening
      chest.setAsOpened();

      // Hide the chest sprite immediately
      chest.setVisible(false);
      chest.setActive(false);

      // Generate loot at chest position using the updated ChestLootTables
      ChestLootTables.generateLootFromTable(
        chestState.lootTable,
        chest.x,
        chest.y,
        (itemId: string, x: number, y: number, quantity?: number) => {
          // Pass all parameters including quantity to spawnItem via entitySpawner
          this.scene.entitySpawner.spawnItem(itemId, x, y, undefined, undefined, quantity);
        }
      );

      // Schedule respawn
      this.scheduleChestRespawn(chestState);

      eventBus.emit("ui.message.show", `You found a treasure chest!`);

      return true;
    } catch (error) {
      console.error("Error in GameSceneChestManager.openChest:", error);
      return false;
    }
  }

  canOpenChestAtTile(tileX: number, tileY: number): Chest | null {
    // First, check if there's an interact-layer object at this tile position
    if (!this.scene.interactLayer) {
      return null;
    }

    let chestAtTile: Chest | null = null;

    // Find interact-layer object at this tile position
    this.scene.interactLayer.objects.forEach((obj: any) => {
      if (obj.properties) {
        let hasChestId = false;

        // Check if this object has chest properties
        obj.properties.forEach((prop: any) => {
          if (prop.name === "id" && prop.value) {
            hasChestId = true;
          }
        });

        if (hasChestId) {
          // Calculate the tile position of this object
          const objCenterX = obj.x + (obj.width || 32) / 2;
          const objCenterY = obj.y + (obj.height || 32) / 2;
          const objTileX = Math.floor(objCenterX / 32);
          const objTileY = Math.floor(objCenterY / 32);

          // Check if this matches the target tile
          if (objTileX === tileX && objTileY === tileY) {
            // Find the corresponding chest sprite
            for (const chestState of this.chestStates.values()) {
              const chest = chestState.chestSprite;
              if (
                chest &&
                (chest as any).tileX === tileX &&
                (chest as any).tileY === tileY &&
                !chestState.isOpen
              ) {
                chestAtTile = chest;
                break;
              }
            }
          }
        }
      }
    });

    return chestAtTile;
  }

  private scheduleChestRespawn(chestState: ChestState): void {
    try {
      // Clear any existing respawn timer
      if (chestState.respawnTimer) {
        chestState.respawnTimer.destroy();
      }

      // Create new respawn timer
      chestState.respawnTimer = this.scene.time.delayedCall(
        chestState.respawnTime * 1000, // Convert seconds to milliseconds
        () => {
          // Respawn the chest
          chestState.isOpen = false;

          // Use the new chest methods to handle respawning
          chestState.chestSprite.setAsClosed();
          chestState.chestSprite.setVisible(true);
          chestState.chestSprite.setActive(true);

          // Use the stored chestType instead of "chest-closed"
          chestState.chestSprite.setTexture(chestState.chestType);
        }
      );
    } catch (error) {
      console.error("Error in GameSceneChestManager.scheduleChestRespawn:", error);
    }
  }

  cleanup(): void {
    try {
      // Clear all chest respawn timers
      this.chestStates.forEach((chestState) => {
        if (chestState.respawnTimer) {
          chestState.respawnTimer.destroy();
        }
      });

      // Clear chest states
      this.chestStates.clear();

      // Clear chest group
      if (this.scene.chests) {
        this.scene.chests.clear(true, true);
      }
    } catch (error) {
      console.error("Error in GameSceneChestManager.cleanup:", error);
    }
  }

  // =============================================================================
  // DEBUG METHODS
  // =============================================================================

  debugChestPositions(): void {
    this.chestStates.forEach((chestState, chestId) => {
      const chest = chestState.chestSprite;
      console.log(`Chest ${chestId}:`, { x: chest.x, y: chest.y, state: chestState });
    });

    if (this.scene.interactLayer) {
      this.scene.interactLayer.objects.forEach((obj: any, index: number) => {
        if (obj.properties) {
          const hasChestId = obj.properties.some((prop: any) => prop.name === "id");
          if (hasChestId) {
            console.log(`Interact object ${index}:`, obj);
          }
        }
      });
    }
  }

  testChestInteraction(tileX: number, tileY: number): void {
    const chest = this.canOpenChestAtTile(tileX, tileY);
    if (chest) {
      this.openChest(chest);
    }
  }

  private getObjectProperty(obj: any, propertyName: string, defaultValue: any = null): any {
    if (!obj || !obj.properties) return defaultValue;
    const property = obj.properties.find((prop: any) => prop.name === propertyName);
    return property ? property.value : defaultValue;
  }
}
