// src/scenes/managers/GameSceneCollisionManager.ts
import { NPC } from "@/entities/NPC";
import type { GameScene } from "../GameScene";

export class GameSceneCollisionManager {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  setupCollisions(): void {
    try {
      // PlayerCharacter collides with map elements
      if (this.scene.collisionLayer && this.scene.playerCharacter) {
        this.scene.physics.add.collider(this.scene.playerCharacter, this.scene.collisionLayer);
      }

      // Items collide with collision layer
      if (this.scene.items && this.scene.collisionLayer) {
        this.scene.physics.add.collider(this.scene.items, this.scene.collisionLayer);
      }

      // Monsters collide with collision layer
      if (this.scene.monsters && this.scene.collisionLayer) {
        this.scene.physics.add.collider(this.scene.monsters, this.scene.collisionLayer);
      }

      // Monsters collide with player
      if (this.scene.monsters && this.scene.playerCharacter) {
        this.scene.physics.add.collider(this.scene.monsters, this.scene.playerCharacter);
      }

      // NPCs collide with collision layer
      if (this.scene.npcs && this.scene.collisionLayer) {
        this.scene.physics.add.collider(this.scene.npcs, this.scene.collisionLayer);
      }

      // Chests collide with collision layer
      if (this.scene.chests && this.scene.collisionLayer) {
        this.scene.physics.add.collider(this.scene.chests, this.scene.collisionLayer);
      }

      // Player can overlap with NPCs for interaction
      if (this.scene.npcs && this.scene.playerCharacter) {
        this.scene.physics.add.overlap(
          this.scene.playerCharacter,
          this.scene.npcs,
          (player, npc) => {
            // Check if player is pressing the interaction key
            const isInteractKeyDown = this.scene.input.keyboard?.checkDown(
              this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
              500
            );

            if (isInteractKeyDown) {
              (npc as NPC).interact();
            }
          }
        );
      }
    } catch (error) {
      console.error("Error in GameSceneCollisionManager.setupCollisions:", error);
    }
  }
}
