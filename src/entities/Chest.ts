// src/entities/Chest.ts
import { Entity } from "./Entity";
import { eventBus } from "@/utils/EventBus";

export class Chest extends Entity {
  public lootTable: string = "default";
  public respawnTime: number = 300; // in seconds
  public isOpen: boolean = false;
  public chestType: string = "chest-good"; // Store the chest type

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    lootTable: string = "default",
    respawnTime: number = 300,
    chestType: string = "chest-good"
  ) {
    super(scene, x, y, chestType, id);

    this.lootTable = lootTable;
    this.respawnTime = respawnTime;
    this.chestType = chestType;

    // Set up physics for the chest sprite
    this.setupPhysics();

    // ADDED: Make the chest interactive
    this.setupInteraction();
  }

  private setupPhysics(): void {
    try {
      // Enable physics for the chest (static body)
      this.scene.physics.add.existing(this, true);

      // Set the physics body size to match the chest sprite
      if (this.body && "setSize" in this.body) {
        (this.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
      }
    } catch (error) {
      console.error("Error setting up chest physics:", error);
    }
  }

  // ADDED: New method to setup chest interaction
  private setupInteraction(): void {
    try {
      // Make the chest sprite interactive
      this.setInteractive();

      // Set the chest to appear above other entities
      this.setDepth(10);

      // Handle chest opening directly when clicked
      this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Check if this is a left click
        if (pointer.button !== 0) return;

        // Get the game scene
        const gameScene = this.scene as any;

        // Check if the player exists and is close enough
        if (!gameScene.playerCharacter) {
          return;
        }

        // Calculate distance from player to chest
        const playerX = gameScene.playerCharacter.x;
        const playerY = gameScene.playerCharacter.y;
        const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
        const maxInteractionDistance = 64; // 2 tiles worth of distance

        if (distance > maxInteractionDistance) {
          eventBus.emit("ui.message.show", "You are too far away to open this chest");
          return;
        }

        // Check if chest is already open
        if (this.isOpen) {
          eventBus.emit("ui.message.show", "This chest is already open");
          return;
        }

        // Try to open the chest using GameScene's method
        if (gameScene.openChest && typeof gameScene.openChest === "function") {
          const success = gameScene.openChest(this);
        } else {
          console.error("gameScene.openChest method not found");
          eventBus.emit("ui.message.show", "Error: Could not open chest");
        }
      });

      // Add hover effects for better user feedback
      this.on("pointerover", () => {
        if (!this.isOpen) {
          this.setTint(0xdddddd); // Slightly brighten on hover
        }
      });

      this.on("pointerout", () => {
        this.clearTint(); // Remove tint when not hovering
      });
    } catch (error) {
      console.error("Error setting up chest interaction:", error);
    }
  }

  /**
   * Check if this chest can be opened
   */
  public canOpen(): boolean {
    return !this.isOpen && this.active;
  }

  /**
   * Get the distance from a point to this chest
   */
  public getDistanceFrom(x: number, y: number): number {
    return Phaser.Math.Distance.Between(x, y, this.x, this.y);
  }

  // ADDED: Method to disable interaction when chest is opened
  public setAsOpened(): void {
    this.isOpen = true;
    this.disableInteractive();
    this.clearTint();
  }

  // ADDED: Method to re-enable interaction when chest respawns
  public setAsClosed(): void {
    this.isOpen = false;
    this.setInteractive();
  }

  update(time: number, delta?: number): void {
    try {
      super.update(time, delta);
      // Chests are static, so minimal update logic needed
    } catch (error) {
      console.error("Error in Chest update:", error);
    }
  }

  destroy(): void {
    try {
      super.destroy();
    } catch (error) {
      console.error("Error destroying chest:", error);
    }
  }
}
