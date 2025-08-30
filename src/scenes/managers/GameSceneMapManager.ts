// src/scenes/managers/GameSceneMapManager.ts
import { eventBus } from "@/utils/EventBus";
import { MapService } from "@/services/MapService";
import { useGameStore } from "@/stores/gameStore";
import type { GameScene } from "../GameScene";

export class GameSceneMapManager {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  loadTiledMap(): boolean {
    try {
      // Create the map using current map key from store
      const store = useGameStore.getState();
      const mapKey = store.currentMap;
      this.scene.map = this.scene.make.tilemap({ key: mapKey });

      // Get all tilesets from the map data
      const tilesetImages: Phaser.Tilemaps.Tileset[] = [];

      // Add all the tilesets
      this.scene.map.tilesets.forEach((tileset) => {
        const tilesetName = tileset.name;
        const tilesetImage = this.scene.map?.addTilesetImage(tilesetName, tilesetName);

        if (tilesetImage) {
          tilesetImages.push(tilesetImage);
        } else {
          console.warn(`Failed to add tileset: ${tilesetName}`);
        }
      });

      // Check if we have any valid tilesets
      if (tilesetImages.length === 0) {
        console.error("No valid tilesets found for the map");
        return false;
      }

      // Create all layers using all tilesets
      this.scene.map.layers.forEach((layerData) => {
        const layer = this.scene.map?.createLayer(layerData.name, tilesetImages);

        if (!layer) return;

        // Store references to important layers
        if (layerData.name === "ground-layer") {
          this.scene.groundLayer = layer;
        } else if (layerData.name === "wall-layer") {
          this.scene.collisionLayer = layer;
        } else if (layerData.name === "collision-layer") {
          // This is our dedicated collision layer
          this.scene.collisionLayer = layer;

          // Set collision for ALL non-empty tiles in this layer
          layer.setCollisionByExclusion([-1]);

          // Make collision layer invisible in game
          layer.setVisible(false);
        }

        layer.setPosition(0, 0);
      });

      // Process object layers
      if (this.scene.map) {
        // Get the interact layer (which is an object layer, not a tile layer)
        this.scene.interactLayer = this.scene.map.getObjectLayer("interact-layer");
      }

      // Set physics bounds to match the visible area
      if (this.scene.groundLayer) {
        this.scene.physics.world.setBounds(
          0,
          0,
          this.scene.groundLayer.displayWidth,
          this.scene.groundLayer.displayHeight
        );
      }

      return true;
    } catch (error) {
      console.error("Error in GameSceneMapManager.loadTiledMap:", error);
      eventBus.emit("ui.message.show", "Error loading map. Check console for details.");
      return false;
    }
  }

  analyzeMapChunks(): void {
    try {
      const store = useGameStore.getState();
      const currentMap = store.currentMap;

      // Import the MapChunkCalculator dynamically in development
      import("../../utils/MapChunkCalculator")
        .then(({ MapChunkCalculator }) => {
          const analysis = MapChunkCalculator.analyzeTiledMap(currentMap, this.scene);

          if (analysis) {
            // Compare with current configuration
            MapService.getMap(currentMap);
          }
        })
        .catch((err) => {
          console.log("MapChunkCalculator not available:", err.message);
        });
    } catch (error) {
      console.log("Map chunk analysis not available:", error);
    }
  }

  cleanupCurrentMap(): void {
    try {
      // Pause physics to prevent collision errors during the transition
      this.scene.physics.pause();

      // Remove all colliders
      this.scene.physics.world.colliders.destroy();

      // Destroy tilemap layers
      if (this.scene.map) {
        const allLayers = this.scene.map.layers;
        allLayers.forEach((layerData) => {
          if (layerData.tilemapLayer) {
            layerData.tilemapLayer.destroy(true);
          }
        });

        // Clean up layer references
        this.scene.groundLayer = undefined;
        this.scene.collisionLayer = undefined;

        // Destroy the map itself
        this.scene.map.destroy();
        this.scene.map = undefined;
      }

      // Clear groups
      if (this.scene.items) {
        this.scene.items.clear(true, true);
      }
      if (this.scene.monsters) {
        this.scene.monsters.clear(true, true);
      }
      if (this.scene.npcs) {
        this.scene.npcs.clear(true, true);
      }
      if (this.scene.chests) {
        this.scene.chests.clear(true, true);
      }

      // Resume physics
      this.scene.physics.resume();
    } catch (error) {
      console.error("Error in GameSceneMapManager.cleanupCurrentMap:", error);
    }
  }

  getDefaultSpawn(currentMap: string): { x: number; y: number } {
    return MapService.getDefaultSpawn(currentMap);
  }

  getObjectProperty(obj: any, propertyName: string, defaultValue: any = null): any {
    if (!obj || !obj.properties) return defaultValue;
    const property = obj.properties.find((prop: any) => prop.name === propertyName);
    return property ? property.value : defaultValue;
  }
}
