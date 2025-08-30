// src/scenes/managers/GameSceneSystemManager.ts
import { CursorPositionSystem } from "@/services/CursorPositionSystem";
import { ItemHoverSystem } from "@/services/ItemHoverSystem";
import { PortalSystem } from "@/services/PortalSystem";
import { MonsterSpawnSystem } from "@/services/MonsterSpawnSystem";
import { autoAttackSystem } from "@/services/AutoAttackSystem";
import { experienceSystem } from "@/services/ExperienceSystem";
import { skillProgressionSystem } from "@/services/SkillProgressionSystem";
import { useGameStore } from "@/stores/gameStore";
import { eventBus } from "@/utils/EventBus";
import type { GameScene } from "../GameScene";

export class GameSceneSystemManager {
  private scene: GameScene;

  // System references
  itemHoverSystem?: ItemHoverSystem;
  cursorPositionSystem!: CursorPositionSystem;
  portalSystem?: PortalSystem;
  monsterSpawnSystem?: MonsterSpawnSystem;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  initializeGameSystems(): void {
    try {
      const store = useGameStore.getState();

      // Initialize systems
      this.itemHoverSystem = new ItemHoverSystem();
      this.cursorPositionSystem = new CursorPositionSystem(this.scene, 32);

      // Initialize monster spawn system
      this.monsterSpawnSystem = new MonsterSpawnSystem(this.scene);
      this.monsterSpawnSystem.initialize();

      // Register systems
      store.registerSystem("itemHoverSystem", this.itemHoverSystem);
      store.registerSystem("gameScene", this.scene);
      store.registerSystem("autoAttackSystem", autoAttackSystem);
      store.registerSystem("skillProgressionSystem", skillProgressionSystem);
      store.registerSystem("monsterSpawnSystem", this.monsterSpawnSystem);
      store.registerSystem("experienceSystem", experienceSystem);

      // Setup systems
      this.itemHoverSystem.setupGlobalPointerHandler(this.scene);
      this.cursorPositionSystem.initialize();
      autoAttackSystem.initialize();

      // Initialize portal system for stair/teleport functionality
      this.initPortalSystem();

      // Expose systems to scene for backward compatibility
      this.scene.itemHoverSystem = this.itemHoverSystem;
      this.scene.cursorPositionSystem = this.cursorPositionSystem;
      this.scene.portalSystem = this.portalSystem;
      this.scene.monsterSpawnSystem = this.monsterSpawnSystem;
    } catch (error) {
      console.error("Error in GameSceneSystemManager.initializeGameSystems:", error);
    }
  }

  private initPortalSystem(): void {
    try {
      // Clean up existing portal system first
      if (this.portalSystem) {
        this.portalSystem.cleanup();
      }

      // Create new portal system if player exists
      if (this.scene.playerCharacter) {
        this.portalSystem = new PortalSystem(this.scene, this.scene.playerCharacter);
        this.portalSystem.setupPortals();
      }
    } catch (error) {
      console.error("Error in GameSceneSystemManager.initPortalSystem:", error);
      eventBus.emit("error.portal.init", { error });
    }
  }

  reinitializeSystemsForNewMap(): void {
    try {
      const store = useGameStore.getState();

      // Clean up and reinitialize ItemHoverSystem
      if (this.itemHoverSystem) {
        this.itemHoverSystem.cleanup();
      }
      this.itemHoverSystem = new ItemHoverSystem();
      store.registerSystem("itemHoverSystem", this.itemHoverSystem);

      // Reinitialize monster spawn system for new map
      if (this.monsterSpawnSystem) {
        this.monsterSpawnSystem.cleanup();
        this.monsterSpawnSystem.initialize();
      }

      // Reinitialize portal system
      this.initPortalSystem();

      // Reinitialize cursor position system
      if (this.cursorPositionSystem) {
        this.cursorPositionSystem.destroy();
      }
      this.cursorPositionSystem = new CursorPositionSystem(this.scene, 32);
      this.cursorPositionSystem.initialize();

      // Update scene references for backward compatibility
      this.scene.itemHoverSystem = this.itemHoverSystem;
      this.scene.cursorPositionSystem = this.cursorPositionSystem;
      this.scene.portalSystem = this.portalSystem;
      this.scene.monsterSpawnSystem = this.monsterSpawnSystem;
    } catch (error) {
      console.error("Error in GameSceneSystemManager.reinitializeSystemsForNewMap:", error);
    }
  }

  updateSystems(time: number, delta: number): void {
    try {
      // Update portal system if it exists
      if (this.portalSystem) {
        this.portalSystem.update(time, delta);
      }
    } catch (error) {
      console.error("Error in GameSceneSystemManager.updateSystems:", error);
    }
  }

  finalizeMapTransition(): void {
    try {
      // Re-setup ItemHoverSystem after map transition
      if (this.itemHoverSystem) {
        setTimeout(() => {
          this.itemHoverSystem!.setupGlobalPointerHandler(this.scene);
        }, 100);
      }
    } catch (error) {
      console.error("Error in GameSceneSystemManager.finalizeMapTransition:", error);
    }
  }

  cleanup(): void {
    try {
      // Cleanup monster spawn system
      if (this.monsterSpawnSystem) {
        this.monsterSpawnSystem.destroy();
      }

      // Cleanup other systems
      if (this.itemHoverSystem) {
        this.itemHoverSystem.cleanup();
      }

      if (this.cursorPositionSystem) {
        this.cursorPositionSystem.destroy();
      }

      if (this.portalSystem) {
        this.portalSystem.cleanup();
      }
    } catch (error) {
      console.error("Error in GameSceneSystemManager.cleanup:", error);
    }
  }
}
