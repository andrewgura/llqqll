import { Item } from "@/entities/Item";
import { Monster } from "@/entities/Monster";
import { NPC } from "@/entities/NPC";
import { MapService } from "@/services/MapService";
import { useGameStore } from "@/stores/gameStore";
import { ItemBonusStats, ItemCategory, ItemData, NPCData } from "@/types";
import { ItemInstanceManager } from "@/utils/ItemInstanceManager";
import { NPCService } from "@/services/NPCService";
import { ItemDictionary } from "@/services/ItemDictionaryService";
import type { GameScene } from "../GameScene";

export class GameSceneEntitySpawner {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  spawnItem(
    templateId: string,
    x: number,
    y: number,
    instanceId?: string,
    bonusStats?: ItemBonusStats,
    quantity?: number
  ): Item | null {
    try {
      // Get current map for coordinate conversion
      const store = useGameStore.getState();
      const currentMap = store.currentMap;

      // Convert the raw coordinates to tile coordinates, then back to centered phaser coordinates
      const tileCoords = MapService.phaserToTiled(currentMap, x, y);
      const centeredCoords = MapService.tiledToPhaser(currentMap, tileCoords.x, tileCoords.y);

      // If no instanceId is provided, always create a new instance
      if (!instanceId) {
        // Check if this item type should be eligible for bonus stats
        const itemData = ItemDictionary.getItem(templateId);
        const shouldGetBonusStats = this.isEligibleForBonusStats(itemData);

        // For equipment items dropped in the world, 20% chance of random bonus stats
        if (shouldGetBonusStats && Math.random() < 0.2) {
          const instance = ItemInstanceManager.createRandomInstance(templateId, quantity);
          instanceId = instance.instanceId;
          bonusStats = instance.bonusStats;
          quantity = instance.quantity;
        } else {
          const instance = ItemInstanceManager.createItemInstance(templateId, bonusStats, quantity);
          instanceId = instance.instanceId;
          quantity = instance.quantity;
        }
      }

      // Create the item using the centered coordinates
      const item = new Item(
        this.scene,
        centeredCoords.x,
        centeredCoords.y,
        templateId,
        instanceId,
        bonusStats,
        quantity
      );
      this.scene.items.add(item);

      // Set up overlap with player
      if (this.scene.playerCharacter) {
        this.scene.physics.add.overlap(this.scene.playerCharacter, item, () => {
          if (!this.scene.playerCharacter.nearbyItems.includes(item)) {
            this.scene.playerCharacter.addNearbyItem(item);
            if (item.highlightItem) item.highlightItem();
          }
        });
      }

      return item;
    } catch (error) {
      console.error("Error in GameSceneEntitySpawner.spawnItem:", error);
      return null;
    }
  }

  spawnMonster(monsterType: string, x: number, y: number): Monster | null {
    try {
      const monster = new Monster(this.scene, x, y, monsterType);
      this.scene.monsters.add(monster);

      // Initialize monster with a default animation
      // Use the animation system to play the idle animation
      monster.playAnimation("down", false);

      return monster;
    } catch (error) {
      console.error("Error in GameSceneEntitySpawner.spawnMonster:", error);
      return null;
    }
  }

  spawnNPC(npcData: NPCData, x: number, y: number): NPC | null {
    try {
      const npc = new NPC(this.scene, x, y, npcData);
      this.scene.npcs.add(npc);

      // Initialize with a default animation
      npc.playAnimation("down", false);

      // Return the created NPC
      return npc;
    } catch (error) {
      console.error("Error in GameSceneEntitySpawner.spawnNPC:", error);
      return null;
    }
  }

  spawnInitialContent(): void {
    this.spawnInitialNPCs();
    this.spawnTestItems();
    // Monster spawning is now handled by MonsterSpawnSystem
  }

  private spawnInitialNPCs(): void {
    try {
      if (!this.scene.map) {
        console.warn("No map available for NPC spawning");
        return;
      }

      // Get the npc-layer object layer
      const npcLayer = this.scene.map.getObjectLayer("npc-layer");
      if (!npcLayer) {
        return;
      }

      // Process each object in the NPC layer
      npcLayer.objects.forEach((obj: any) => {
        try {
          // Extract the npcId property from the Tiled object
          const npcId = this.getObjectProperty(obj, "npcId", "");

          if (!npcId) {
            console.warn("NPC spawn point missing npcId property:", obj);
            return;
          }

          // Get NPC data from NPCService
          const npcData = NPCService.getNPC(npcId);
          if (!npcData) {
            console.warn(`NPC data not found for id: ${npcId}`);
            return;
          }

          // Convert raw Tiled coordinates to proper positions
          const tileSize = 32;
          let tiledX, tiledY;

          if (obj.width && obj.height) {
            // For rectangular objects, use center point
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            tiledX = Math.floor(centerX / tileSize);
            tiledY = Math.floor(centerY / tileSize);
          } else {
            // For point objects, convert pixel coordinates directly to tile coordinates
            tiledX = Math.floor(obj.x / tileSize);
            tiledY = Math.floor(obj.y / tileSize);
          }

          // Get current map for coordinate conversion
          const store = useGameStore.getState();
          const currentMap = store.currentMap;

          // Convert Tiled coordinates to Phaser world coordinates using MapService
          const phaserCoords = MapService.tiledToPhaser(currentMap, tiledX, tiledY);

          //spawn npc
          this.spawnNPC(npcData, phaserCoords.x, phaserCoords.y);
        } catch (error) {
          console.error("Error processing NPC spawn point:", obj, error);
        }
      });
    } catch (error) {
      console.error("Error in GameSceneEntitySpawner.spawnInitialNPCs:", error);
    }
  }

  private spawnTestItems(): void {
    try {
      const store = useGameStore.getState();
      const currentMap = store.currentMap;

      // Spawn test items on each map
      if (currentMap === "game-map") {
        this.spawnItem("fireSword", 1584, 240);
      }
    } catch (error) {
      console.error("Error spawning test items:", error);
    }
  }

  private isEligibleForBonusStats(itemData: ItemData | null): boolean {
    if (!itemData || !itemData.category) return false;

    // Only equipment items should be eligible for bonus stats
    const equipmentCategories = [
      ItemCategory.WEAPON_MELEE,
      ItemCategory.WEAPON_MAGIC,
      ItemCategory.WEAPON_RANGED,
      ItemCategory.ARMOR,
      ItemCategory.SHIELD,
      ItemCategory.HELMET,
      ItemCategory.AMULET,
      ItemCategory.TRINKET,
    ];

    return equipmentCategories.includes(itemData.category);
  }

  private getObjectProperty(obj: any, propertyName: string, defaultValue: any = null): any {
    if (!obj || !obj.properties) return defaultValue;
    const property = obj.properties.find((prop: any) => prop.name === propertyName);
    return property ? property.value : defaultValue;
  }
}
