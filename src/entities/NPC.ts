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

  private merchantIcon: Phaser.GameObjects.Text | null = null;
  private icons: Phaser.GameObjects.Text[] = [];
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

      // CHANGED: Create all icons instead of just merchant
      this.createAllIcons(npcData);

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

  // CHANGED: Replaced createMerchantIcon with createAllIcons
  private createAllIcons(npcData: NPCData): void {
    try {
      const iconTypes = [];

      if (npcData.isMerchant) iconTypes.push({ emoji: "💰", type: "merchant" });
      if (npcData.isMainQuestGiver) iconTypes.push({ emoji: "⭐", type: "mainQuest" });
      if (npcData.isQuestGiver) iconTypes.push({ emoji: "❗", type: "sideQuest" });
      if (npcData.isWarriorTrainer) iconTypes.push({ emoji: "⚔️", type: "warrior" });
      if (npcData.isMageTrainer) iconTypes.push({ emoji: "🔮", type: "mage" });
      if (npcData.isArcherTrainer) iconTypes.push({ emoji: "🏹", type: "archer" });
      if (npcData.isStatSeller) iconTypes.push({ emoji: "📈", type: "stats" });

      if (iconTypes.length === 0) return;

      const iconSpacing = 25;
      const startX = this.x - ((iconTypes.length - 1) * iconSpacing) / 2;

      iconTypes.forEach((iconInfo, index) => {
        const iconX = startX + index * iconSpacing;

        const icon = this.scene.add.text(iconX, this.y - 65, iconInfo.emoji, {
          fontSize: "20px",
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: "#000",
            blur: 2,
            fill: true,
          },
        });

        icon.setOrigin(0.5);
        icon.setDepth(10);

        this.scene.tweens.add({
          targets: icon,
          y: this.y - 70,
          duration: 1500 + index * 100,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        this.icons.push(icon);

        // Keep the first icon as merchantIcon for backward compatibility
        if (index === 0) {
          this.merchantIcon = icon;
        }
      });
    } catch (error) {
      console.error(`Error creating icons for NPC ${this.id}:`, error);
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
      eventBus.emit("error.npc.highlightCircle", {
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

  // PRESERVED: Original click handling logic
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

  // PRESERVED: Original interaction methods
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
      } else {
        // No quests available, show regular dialog
        eventBus.emit("npc.dialog.started", {
          npcId: this.id,
          npcName: this.npcName,
          dialog: this.dialogData,
        });
      }

      // Emit interaction event
      eventBus.emit("npc.interacted", {
        id: this.id,
        name: this.npcName,
      });
    } catch (error) {
      console.error(`Error opening quest for NPC ${this.id}:`, error);
    }
  }

  interact(): void {
    try {
      // Emit interaction event with NPC data
      eventBus.emit("npc.interact", {
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

      // icons
      if (this.icons.length > 0) {
        const iconSpacing = 25;
        const startX = this.x - ((this.icons.length - 1) * iconSpacing) / 2;
        this.icons.forEach((icon, index) => {
          icon.setX(startX + index * iconSpacing);
        });
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

      // Destroy icons
      this.icons.forEach((icon) => {
        if (icon && icon !== this.merchantIcon) {
          icon.destroy();
        }
      });
      this.icons = [];

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
