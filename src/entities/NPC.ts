import { NPCService } from "@/services/NPCService";
import { ShopItem, NPCData } from "@/types";
import { Character } from "./Character";
import { HealthComponent } from "./HealthComponent";
import { eventBus } from "@/utils/EventBus";

export class NPC extends Character {
  npcName: string = "";
  facing: string = "down";
  dialogData: string[] = [];
  interactionRadius: number = 64;
  shopItems: ShopItem[] = [];

  isMerchant: boolean = false;
  isStatSeller: boolean = false;

  // UI elements
  private merchantIcon: Phaser.GameObjects.Text | null = null;
  private highlightCircle: Phaser.GameObjects.Arc | null = null;
  private isHighlighted: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, npcData: NPCData) {
    // Call the parent constructor with the provided texture
    super(scene, x, y, npcData.texture || "playerCharacter", npcData.id);

    try {
      // Set NPC properties
      this.id = npcData.id;
      this.npcName = npcData.name || "Unnamed NPC";
      this.dialogData = npcData.dialog || ["Hello, adventurer!"];
      this.interactionRadius = npcData.interactionRadius || 64;
      this.isMerchant = npcData.isMerchant || false;
      this.shopItems = npcData.shopItems || [];
      this.isStatSeller = npcData.isStatSeller || false;

      // Set origin to center the sprite on the tile
      this.setOrigin(0.8, 0.8);

      // Add components
      this.addComponents();

      // Set up interaction zone
      this.createInteractionZone();

      // Create visual elements
      if (this.isMerchant) {
        this.createMerchantIcon();
      }

      // Create highlight circle (initially hidden)
      this.createHighlightCircle();

      // Set up click interaction with proper right-click handling
      this.setInteractive();

      // Handle both left and right clicks
      this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Prevent default behavior for right-click
        if (pointer.rightButtonDown()) {
          if (pointer.event) {
            pointer.event.preventDefault();
            pointer.event.stopPropagation();
          }
        }
        this.handleClick();
      });

      // Add a specific handler for right-click context menu prevention
      this.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonReleased() && pointer.event) {
          pointer.event.preventDefault();
          return false;
        }
      });

      // Add hover event handlers
      this.on("pointerover", this.handlePointerOver.bind(this));
      this.on("pointerout", this.handlePointerOut.bind(this));

      // Set default animation
      this.playAnimation("down", false);

      // Emit NPC created event
      eventBus.emit("npc.created", {
        id: this.id,
        name: this.npcName,
        isMerchant: this.isMerchant,
        position: { x: this.x, y: this.y },
      });
    } catch (error) {
      console.error(`Error creating NPC ${npcData.id}:`, error);
      eventBus.emit("error.npc.create", {
        id: npcData.id,
        error,
      });
    }
  }

  private addComponents(): void {
    try {
      // Health component (NPCs typically don't need health, but inheriting from Character requires it)
      this.components.add("health", new HealthComponent(this));
    } catch (error) {
      console.error(`Error adding components to NPC ${this.id}:`, error);
      eventBus.emit("error.npc.components", {
        id: this.id,
        error,
      });
    }
  }

  private createInteractionZone(): void {
    try {
      // Create a circle for interaction detection
      const interactionZone = this.scene.add.circle(
        this.x,
        this.y,
        this.interactionRadius,
        0xffffff,
        0.1
      );

      // Make it invisible in the game
      interactionZone.setVisible(false);

      // Add physics to the interaction zone
      this.scene.physics.add.existing(interactionZone, true);

      // Store the interaction zone
      (this as any).interactionZone = interactionZone;
    } catch (error) {
      console.error(`Error creating interaction zone for NPC ${this.id}:`, error);
      eventBus.emit("error.npc.interactionZone", {
        id: this.id,
        error,
      });
    }
  }

  private createMerchantIcon(): void {
    try {
      // Use a coin symbol as merchant icon with improved styling
      this.merchantIcon = this.scene.add.text(this.x, this.y - 65, "💰", {
        fontSize: "20px", // Larger size
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#000",
          blur: 2,
          fill: true,
        },
      });

      this.merchantIcon.setOrigin(0.5);
      this.merchantIcon.setDepth(10);

      // More pronounced floating animation
      this.scene.tweens.add({
        targets: this.merchantIcon,
        y: this.y - 70,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } catch (error) {
      console.error(`Error creating merchant icon for NPC ${this.id}:`, error);
      eventBus.emit("error.npc.merchantIcon", {
        id: this.id,
        error,
      });
    }
  }

  private createHighlightCircle(): void {
    try {
      // Create a circle that will be used for highlighting
      this.highlightCircle = this.scene.add.circle(
        this.x,
        this.y,
        this.interactionRadius + 10, // Slightly larger than interaction radius
        0xff0000, // Default red color
        0 // Initially invisible
      );

      this.highlightCircle.setStrokeStyle(3, 0xff0000, 0.8);
      this.highlightCircle.setDepth(1); // Behind other elements but visible
      this.highlightCircle.setVisible(false);
    } catch (error) {
      console.error(`Error creating highlight circle for NPC ${this.id}:`, error);
      eventBus.emit("error.npc.highlight", {
        id: this.id,
        error,
      });
    }
  }

  private handlePointerOver(): void {
    try {
      this.showHighlight();
      this.updateHighlightColor();
    } catch (error) {
      console.error(`Error handling pointer over for NPC ${this.id}:`, error);
    }
  }

  private handlePointerOut(): void {
    try {
      this.hideHighlight();
      // Reset cursor
      if (this.scene.game.canvas) {
        this.scene.game.canvas.style.cursor = "default";
      }
    } catch (error) {
      console.error(`Error handling pointer out for NPC ${this.id}:`, error);
    }
  }

  private showHighlight(): void {
    if (this.highlightCircle) {
      this.highlightCircle.setVisible(true);
      this.isHighlighted = true;
    }
  }

  private hideHighlight(): void {
    if (this.highlightCircle) {
      this.highlightCircle.setVisible(false);
      this.isHighlighted = false;
    }
  }

  private updateHighlightColor(): void {
    if (!this.highlightCircle) return;

    try {
      // Check distance to player
      const scene = this.scene as any;
      if (!scene.playerCharacter) return;

      const player = scene.playerCharacter;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (distance <= this.interactionRadius) {
        // Within range - green highlight and pointer cursor
        this.highlightCircle.setStrokeStyle(3, 0x00ff00, 0.8); // Green
        if (this.scene.game.canvas) {
          this.scene.game.canvas.style.cursor = "pointer";
        }
      } else {
        // Out of range - red highlight and not-allowed cursor
        this.highlightCircle.setStrokeStyle(3, 0xff0000, 0.8); // Red
        if (this.scene.game.canvas) {
          this.scene.game.canvas.style.cursor = "not-allowed";
        }
      }
    } catch (error) {
      console.error(`Error updating highlight color for NPC ${this.id}:`, error);
    }
  }

  private handleClick(): void {
    try {
      const scene = this.scene as any;
      if (!scene.playerCharacter) return;

      const player = scene.playerCharacter;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (distance <= this.interactionRadius) {
        if (this.isStatSeller) {
          this.openStatSeller();
        } else if (this.isMerchant) {
          this.openShop();
        } else {
          this.openQuest();
        }
      }
    } catch (error) {
      console.error(`Error handling click for NPC ${this.id}:`, error);
    }
  }

  openStatSeller(): void {
    try {
      eventBus.emit("stat-seller.open", {
        npcId: this.id,
        npcName: this.npcName,
      });
    } catch (error) {
      console.error(`Error opening stat seller for NPC ${this.id}:`, error);
    }
  }

  openShop(): void {
    try {
      // Emit an event that the shop UI can listen to
      eventBus.emit("shop.open", {
        npcId: this.id,
        npcName: this.npcName,
        shopItems: this.shopItems,
      });
    } catch (error) {
      console.error(`Error opening shop for NPC ${this.id}:`, error);
      eventBus.emit("error.npc.shop", {
        id: this.id,
        error,
      });
    }
  }

  playAnimation(direction: string, isMoving: boolean = false): void {
    try {
      // Update facing direction if specified
      if (direction) {
        this.facing = direction;
      }

      // Construct animation key (always use idle since NPCs are stationary)
      const animKey = `idle-${this.facing}`;

      // Only play animation if it's not already playing
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== animKey) {
        this.anims.play(animKey, true);

        // Emit animation event
        eventBus.emit("npc.animation", {
          id: this.id,
          direction: this.facing,
          isMoving: isMoving,
        });
      }
    } catch (error) {
      console.error(`Error playing animation for NPC ${this.id}:`, error);
      eventBus.emit("error.npc.animation", {
        id: this.id,
        error,
      });
    }
  }

  openQuest(): void {
    try {
      // Check if this NPC is a quest giver
      const npcData = NPCService.getNPC(this.id);

      if (npcData?.isQuestGiver && npcData.quests?.side && npcData.quests.side.length > 0) {
        // Show quest giver dialog instead of regular dialog
        const questIds = npcData.quests.side.map((q) => q.name);
        eventBus.emit("questGiver.show", {
          npcId: this.id,
          npcName: this.npcName,
          availableQuests: questIds,
        });
      }

      // Emit interaction event
      eventBus.emit("npc.interacted", {
        id: this.id,
        name: this.npcName,
      });
    } catch (error) {
      console.error(`Error interacting with NPC ${this.id}:`, error);
      eventBus.emit("error.npc.interact", {
        id: this.id,
        error,
      });
    }
  }

  update(time: number, delta: number): void {
    try {
      // Update all components
      super.update(time, delta);

      // Update interaction zone position
      if ((this as any).interactionZone) {
        (this as any).interactionZone.x = this.x;
        (this as any).interactionZone.y = this.y;
      }

      // Update merchant icon position (x only since y is animated)
      if (this.merchantIcon) {
        this.merchantIcon.setX(this.x);
      }

      // Update highlight circle position
      if (this.highlightCircle) {
        this.highlightCircle.setPosition(this.x, this.y);

        // Update highlight color if currently highlighted (for real-time distance checking)
        if (this.isHighlighted) {
          this.updateHighlightColor();
        }
      }
    } catch (error) {
      console.error(`Error in NPC ${this.id} update:`, error);
      eventBus.emit("error.npc.update", {
        id: this.id,
        error,
      });
    }
  }

  destroy(): void {
    try {
      // Remove pointer interactivity
      this.off("pointerdown");
      this.off("pointerup");
      this.off("pointerover");
      this.off("pointerout");
      this.disableInteractive();

      // Destroy interaction zone
      if ((this as any).interactionZone) {
        (this as any).interactionZone.destroy();
      }

      // Destroy merchant icon
      if (this.merchantIcon) {
        this.merchantIcon.destroy();
        this.merchantIcon = null;
      }

      // Destroy highlight circle
      if (this.highlightCircle) {
        this.highlightCircle.destroy();
        this.highlightCircle = null;
      }

      // Reset cursor
      if (this.scene.game.canvas) {
        this.scene.game.canvas.style.cursor = "default";
      }

      // Emit destroy event
      eventBus.emit("npc.destroyed", {
        id: this.id,
        name: this.npcName,
      });

      // Call parent destroy to clean up components
      super.destroy();
    } catch (error) {
      console.error(`Error destroying NPC ${this.id}:`, error);
      eventBus.emit("error.npc.destroy", {
        id: this.id,
        error,
      });
    }
  }
}
