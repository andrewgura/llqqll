// src/scenes/GameScene.ts
import { eventBus } from "../utils/EventBus";
import { PlayerCharacter } from "@/entities/PlayerCharacter";
import { useGameStore } from "@/stores/gameStore";
import {
  GameSceneMapManager,
  GameSceneEntitySpawner,
  GameSceneChestManager,
  GameSceneCollisionManager,
  GameSceneSystemManager,
  GameSceneTransitionManager,
} from "./managers";

export class GameScene extends Phaser.Scene {
  declare playerCharacter: PlayerCharacter;
  declare items: Phaser.GameObjects.Group;
  declare monsters: Phaser.GameObjects.Group;
  declare npcs: Phaser.GameObjects.Group;
  declare chests: Phaser.GameObjects.Group;

  // Map-related properties
  map?: Phaser.Tilemaps.Tilemap;
  groundLayer?: Phaser.Tilemaps.TilemapLayer;
  interactLayer?: Phaser.Tilemaps.ObjectLayer | null;
  collisionLayer?: Phaser.Tilemaps.TilemapLayer;
  isChangingMap: boolean = false;

  // System properties (for backward compatibility)
  itemHoverSystem?: any;
  cursorPositionSystem!: any;
  portalSystem?: any;
  monsterSpawnSystem?: any;

  // Manager instances
  public mapManager: GameSceneMapManager;
  public entitySpawner: GameSceneEntitySpawner;
  public chestManager: GameSceneChestManager;
  public collisionManager: GameSceneCollisionManager;
  public systemManager: GameSceneSystemManager;
  public transitionManager: GameSceneTransitionManager;

  constructor() {
    super({ key: "game" });

    // Initialize managers
    this.mapManager = new GameSceneMapManager(this);
    this.entitySpawner = new GameSceneEntitySpawner(this);
    this.chestManager = new GameSceneChestManager(this);
    this.collisionManager = new GameSceneCollisionManager(this);
    this.systemManager = new GameSceneSystemManager(this);
    this.transitionManager = new GameSceneTransitionManager(this);
  }

  create(): void {
    try {
      // Get store state
      const store = useGameStore.getState();

      // Emit scene changed event
      eventBus.emit("scene.switched", this);

      // Load the Tiled map
      this.mapManager.loadTiledMap();

      // Auto-analyze map chunks during development
      if (process.env.NODE_ENV === "development") {
        this.mapManager.analyzeMapChunks();
      }

      // Create item, monster, NPC, and chest groups
      this.createGameGroups();

      // Initialize chests from interact-layer
      this.chestManager.initializeChests();

      // Determine player spawn position and create player
      this.createPlayerCharacter();

      // Set up camera to follow playerCharacter
      this.setupCamera();

      // Initialize game systems
      this.systemManager.initializeGameSystems();

      store.initializeQuestSystem();

      // Spawn initial content
      this.entitySpawner.spawnInitialContent();

      // Setup collisions
      this.collisionManager.setupCollisions();

      // Emit game scene ready event
      eventBus.emit("game.scene.ready", { scene: this });
    } catch (error) {
      console.error("Error in GameScene.create:", error);
      eventBus.emit("ui.error.show", `Error creating game scene: ${(error as Error).message}`);
    }
  }

  update(time: number, delta: number): void {
    try {
      // Skip updates while changing maps to avoid issues
      if (this.isChangingMap) return;

      // Update playerCharacter
      if (this.playerCharacter && this.playerCharacter.active) {
        this.playerCharacter.update(time);

        // Ensure camera follows smoothly by updating every frame
        this.cameras.main.scrollX = Phaser.Math.Linear(
          this.cameras.main.scrollX,
          this.playerCharacter.x - this.cameras.main.width / 2,
          0.08
        );
        this.cameras.main.scrollY = Phaser.Math.Linear(
          this.cameras.main.scrollY,
          this.playerCharacter.y - this.cameras.main.height / 2,
          0.08
        );
      }

      // Update all game entities
      this.updateGameEntities(time, delta);

      // Update systems through system manager
      this.systemManager.updateSystems(time, delta);
    } catch (error) {
      console.error("Error in GameScene.update:", error);
    }
  }

  // =============================================================================
  // CORE SCENE SETUP METHODS
  // =============================================================================

  private createGameGroups(): void {
    try {
      // Create groups for game entities
      this.items = this.add.group();
      this.monsters = this.add.group();
      this.npcs = this.add.group();
      this.chests = this.add.group();
    } catch (error) {
      console.error("Error creating game groups:", error);
      eventBus.emit("ui.error.show", `Error creating game groups: ${(error as Error).message}`);
    }
  }

  private createPlayerCharacter(): void {
    try {
      const store = useGameStore.getState();

      // Determine player spawn position
      let startX: number;
      let startY: number;

      // Check if we have teleport coordinates from a map transition
      if (store.playerCharacter.teleportPosition) {
        startX = store.playerCharacter.teleportPosition.x;
        startY = store.playerCharacter.teleportPosition.y;

        // Clear the teleport position after using it
        delete store.playerCharacter.teleportPosition;
      } else {
        // Otherwise use default positions for the current map
        const currentMap = store.currentMap;
        const defaultSpawn = this.mapManager.getDefaultSpawn(currentMap);
        startX = defaultSpawn.x;
        startY = defaultSpawn.y;
      }

      // Create the player character at the determined position
      this.playerCharacter = new PlayerCharacter(this, startX, startY);
    } catch (error) {
      console.error("Error creating player character:", error);
    }
  }

  private setupCamera(): void {
    try {
      // Set up camera to follow playerCharacter
      this.cameras.main.startFollow(
        this.playerCharacter,
        true, // roundPixels
        100, // lerpX
        100, // lerpY
        0, // offsetX
        0 // offsetY
      );
      this.cameras.main.setZoom(2.1);

      // Fade in when the scene starts
      this.cameras.main.fadeIn(500, 0, 0, 0);
    } catch (error) {
      console.error("Error setting up camera:", error);
    }
  }

  private updateGameEntities(time: number, delta: number): void {
    try {
      // Get systems from the store
      const store = useGameStore.getState();
      const systems = store.systems || {};

      // Update auto attack if available
      if (systems.autoAttackSystem) {
        systems.autoAttackSystem.update();
      }

      // Update items
      if (this.items) {
        this.items.getChildren().forEach((item) => {
          if ((item as any).update) {
            (item as any).update();
          }
        });
      }

      // Update monsters
      if (this.monsters) {
        this.monsters.getChildren().forEach((gameObject) => {
          const monster = gameObject as any;
          if (monster.active && monster.update) {
            monster.update(time, delta);
          }
        });
      }

      // Update NPCs
      if (this.npcs) {
        this.npcs.getChildren().forEach((gameObject) => {
          const npc = gameObject as any;
          if (npc.active && npc.update) {
            npc.update(time, delta);
          }
        });
      }

      // Update chests
      if (this.chests) {
        this.chests.getChildren().forEach((gameObject) => {
          const chest = gameObject as any;
          if (chest.active && chest.update) {
            chest.update(time, delta);
          }
        });
      }
    } catch (error) {
      console.error("Error updating game entities:", error);
    }
  }

  // =============================================================================
  // PUBLIC MANAGER ACCESS METHODS
  // =============================================================================

  // Entity spawning methods (delegate to EntitySpawner)
  spawnItem(
    templateId: string,
    x: number,
    y: number,
    instanceId?: string,
    bonusStats?: any,
    quantity?: number
  ): any {
    return this.entitySpawner.spawnItem(templateId, x, y, instanceId, bonusStats, quantity);
  }

  spawnMonster(monsterType: string, x: number, y: number): any {
    return this.entitySpawner.spawnMonster(monsterType, x, y);
  }

  spawnNPC(npcData: any, x: number, y: number): any {
    return this.entitySpawner.spawnNPC(npcData, x, y);
  }

  // Chest methods (delegate to ChestManager)
  spawnChest(
    chestId: string,
    x: number,
    y: number,
    lootTable?: string,
    respawnTime?: number,
    chestType?: string
  ): any {
    return this.chestManager.spawnChest(chestId, x, y, lootTable, respawnTime, chestType);
  }

  openChest(chest: any): boolean {
    return this.chestManager.openChest(chest);
  }

  canOpenChestAtTile(tileX: number, tileY: number): any {
    return this.chestManager.canOpenChestAtTile(tileX, tileY);
  }

  debugChestPositions(): void {
    this.chestManager.debugChestPositions();
  }

  testChestInteraction(tileX: number, tileY: number): void {
    this.chestManager.testChestInteraction(tileX, tileY);
  }

  // Map transition methods (delegate to TransitionManager)
  teleportPlayerInSameMap(destX: number, destY: number, message?: string): void {
    this.transitionManager.teleportPlayerInSameMap(destX, destY, message);
  }

  changeMap(mapKey: string, destX: number, destY: number, message?: string): void {
    this.transitionManager.changeMap(mapKey, destX, destY, message);
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  destroy(): void {
    try {
      // Cleanup managers
      this.chestManager.cleanup();
      this.systemManager.cleanup();
      this.transitionManager.cleanup();

      // Remove key listeners
      if (this.input?.keyboard) {
        this.input.keyboard.off("keydown-E");
      }
    } catch (error) {
      console.error("Error destroying GameScene:", error);
    }
  }
}
