// =============================================================================
// UPDATED MAPTRANSITIONSCENE.TS - Remove delays for instant transitions
// =============================================================================

import Phaser from "phaser";
import { useGameStore } from "../stores/gameStore";
import { eventBus } from "../utils/EventBus";

export class MapTransitionScene extends Phaser.Scene {
  private targetMap: string = "";
  private targetX: number = 0;
  private targetY: number = 0;
  private message: string = "";

  constructor() {
    super({ key: "map-transition" });
  }

  init(data: { targetMap: string; targetX: number; targetY: number; message?: string }): void {
    this.targetMap = data.targetMap;
    this.targetX = data.targetX;
    this.targetY = data.targetY;
    this.message = data.message || "";
  }

  create(): void {
    const store = useGameStore.getState();
    store.updatePlayerMap(this.targetMap);

    // Set teleport position
    store.playerCharacter.teleportPosition = {
      x: this.targetX,
      y: this.targetY,
    };

    // Emit map change event
    eventBus.emit("map.changed", this.targetMap);

    // Emit message if provided
    if (this.message) {
      eventBus.emit("ui.message.show", this.message);
    }

    this.scene.stop("game");
    this.scene.start("game");

    this.scene.get("game").events.once("create", () => {
      this.scene.stop();
    });
  }
}
