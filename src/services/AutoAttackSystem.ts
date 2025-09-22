// src/services/AutoAttackSystem.ts
import { eventBus } from "../utils/EventBus";
import { useGameStore } from "../stores/gameStore";
import { ItemDictionary } from "./ItemDictionaryService";
import { DamageFormulas } from "@/utils/formulas";
import { KillBonusService } from "./KillBonusService";
import { DamageType } from "@/types";

class AutoAttackSystemService {
  private targetedEnemy: any | null = null;
  private lastAttackTime: number = 0;
  private baseAttackCooldown: number = 2000; // Base 2 seconds for players
  private attackRange: number = 64; // Default range (2 tiles)
  private isAutoAttacking: boolean = false;
  private currentWeaponType: string = "melee"; // Default weapon type
  private storeUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  initialize(): void {
    // Subscribe directly to store changes for equipment
    this.storeUnsubscribe = useGameStore.subscribe(
      (state) => state.playerCharacter.equipment,
      () => {
        this.updateAttackProperties();
      },
      {
        equalityFn: (a, b) => {
          // Custom equality check to detect weapon changes
          return a?.weapon?.templateId === b?.weapon?.templateId;
        },
      }
    );

    // Subscribe to monster death
    eventBus.on("monster.died", this.handleMonsterDeath.bind(this));

    // Initialize attack properties
    this.updateAttackProperties();
  }

  /**
   * Calculate current attack cooldown based on attack speed
   * Base: 2000ms (2 seconds)
   * Attack Speed reduces this by 50ms per point
   * Minimum: 200ms (0.2 seconds) to prevent too fast attacks
   */
  private calculateAttackCooldown(): number {
    const store = useGameStore.getState();
    const calculatedStats = store.calculatedStats;

    // Get total attack speed from calculated stats (includes equipment + base)
    const totalAttackSpeed = calculatedStats?.totalAttackSpeed || 1;

    // Base 2 seconds, reduced by 50ms per attack speed point
    // Formula: 2000 - ((attackSpeed - 1) * 50)
    const cooldown = this.baseAttackCooldown - (totalAttackSpeed - 1) * 50;

    // Ensure minimum cooldown of 200ms
    return Math.max(200, cooldown);
  }

  /**
   * Handle monster death by clearing target
   */
  private handleMonsterDeath(data: { id: string; type: string; name: string }): void {
    if (!data || !this.targetedEnemy) return;

    // If our targeted monster died, clear the target
    if (
      this.targetedEnemy.id === data.id ||
      (this.targetedEnemy.monsterType === data.type && this.targetedEnemy.monsterName === data.name)
    ) {
      this.clearTarget();
    }
  }

  /**
   * Set the target for auto-attacking
   */
  setTarget(enemy: any): void {
    // Clear existing target first
    this.clearTarget();

    // Set new target
    this.targetedEnemy = enemy;
    this.isAutoAttacking = true;
    this.lastAttackTime = 0; // Reset to allow immediate attack

    // Show target indicator on the monster
    enemy.showTargetIndicator?.();

    // Notify UI or other systems about targeting
    eventBus.emit("target.selected", { target: enemy });
  }

  /**
   * Clear the current target and stop auto-attacking
   */
  clearTarget(): void {
    if (!this.targetedEnemy) return;

    // Hide target indicator on the current target
    this.targetedEnemy?.hideTargetIndicator?.();

    const previousTarget = this.targetedEnemy;
    this.targetedEnemy = null;
    this.isAutoAttacking = false;

    // Notify about untargeting
    eventBus.emit("target.cleared", { previousTarget });
  }

  /**
   * Update attack properties when equipment changes
   */
  private updateAttackProperties(): void {
    try {
      const store = useGameStore.getState();
      const weaponEquipped = store.playerCharacter.equipment.weapon;

      if (weaponEquipped && weaponEquipped.templateId) {
        // Get weapon type from the item dictionary
        const weaponType = ItemDictionary.getWeaponType(weaponEquipped.templateId);

        this.currentWeaponType = weaponType || "melee";

        // Set attack range based on weapon type
        switch (this.currentWeaponType) {
          case "melee":
            this.attackRange = 64; // 2 tiles
            break;
          case "archery":
            this.attackRange = 320; // 10 tiles
            break;
          case "magic":
            this.attackRange = 256; // 8 tiles
            break;
          default:
            // Default values for other/unknown weapon types
            this.attackRange = 64; // 2 tiles
            this.currentWeaponType = "melee";
            break;
        }
      } else {
        // No weapon equipped - use default values (melee)
        this.attackRange = 48; // 1.5 tiles
        this.currentWeaponType = "melee";
      }

      // Emit event for UI updates (attack speed may have changed)
      eventBus.emit("player.attackSpeed.updated", {
        attackCooldown: this.calculateAttackCooldown(),
        weaponType: this.currentWeaponType,
      });
    } catch (error) {
      console.error("Error in updateAttackProperties:", error);
    }
  }

  /**
   * Get damage type color for floating text
   */
  private getDamageTypeColor(damageType?: DamageType): string {
    switch (damageType) {
      case DamageType.FIRE:
        return "#ff6b47";
      case DamageType.ICE:
        return "#6bb6ff";
      case DamageType.ENERGY:
        return "#ffeb3b";
      case DamageType.POISON:
        return "#8bc34a";
      case DamageType.PHYSICAL:
      default:
        return "#ffffff";
    }
  }

  /**
   * Display floating damage number above the target
   */
  private showDamageNumber(x: number, y: number, damage: number, damageType?: DamageType): void {
    try {
      const gameScene = this.getGameScene();
      if (!gameScene) return;

      const color = this.getDamageTypeColor(damageType);

      // Create floating damage text
      const damageText = gameScene.add.text(x, y - 20, damage.toString(), {
        fontSize: "14px",
        color: color,
        stroke: "#000000",
        strokeThickness: 2,
      });

      damageText.setDepth(10);
      damageText.setOrigin(0.5, 0.5);

      // Animate the text
      gameScene.tweens.add({
        targets: damageText,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          damageText.destroy();
        },
      });
    } catch (error) {
      console.error("Error showing damage number:", error);
    }
  }

  /**
   * Calculate attack damages - returns primary damage and optional secondary damage
   */
  private calculateAttackDamages(): {
    primary: number;
    secondary?: { damage: number; type: DamageType; attackType: string };
  } {
    // Read from GameStore (single source of truth)
    const store = useGameStore.getState();
    const equipment = store.playerCharacter.equipment;
    const skills = store.playerCharacter.skills;

    // Calculate primary damage using existing formula
    const primaryDamage = DamageFormulas.calculatePlayerAutoAttackDamage(
      equipment,
      skills,
      this.currentWeaponType
    );

    // Apply kill bonus to primary damage
    const bonusedPrimaryDamage =
      this.targetedEnemy && this.targetedEnemy.monsterType
        ? KillBonusService.applyDamageBonus(primaryDamage, this.targetedEnemy.monsterType)
        : primaryDamage;

    // Check for secondary attack
    const weaponEquipped = equipment.weapon;
    if (weaponEquipped && weaponEquipped.templateId) {
      const weaponData = ItemDictionary.getItem(weaponEquipped.templateId);

      if (weaponData?.secondaryAttackType && weaponData?.secondaryDamagePeanlty) {
        // Calculate secondary damage as percentage of primary damage
        const secondaryDamageRaw = Math.round(
          bonusedPrimaryDamage * (weaponData.secondaryDamagePeanlty / 100)
        );

        // Apply kill bonus to secondary damage too
        const secondaryDamage =
          this.targetedEnemy && this.targetedEnemy.monsterType
            ? KillBonusService.applyDamageBonus(secondaryDamageRaw, this.targetedEnemy.monsterType)
            : secondaryDamageRaw;

        return {
          primary: bonusedPrimaryDamage,
          secondary: {
            damage: Math.max(1, secondaryDamage),
            type: weaponData.secondaryDamageType || DamageType.PHYSICAL,
            attackType: this.getWeaponTypeFromAttackType(weaponData.secondaryAttackType),
          },
        };
      }
    }

    return { primary: bonusedPrimaryDamage };
  }

  /**
   * Convert PlayerAttackType to weapon type string
   */
  private getWeaponTypeFromAttackType(attackType: any): string {
    switch (attackType) {
      case "Magic":
        return "magic";
      case "Ranged":
        return "archery";
      case "Melee":
      default:
        return "melee";
    }
  }

  /**
   * Perform the attack action
   */
  private performAttack(): boolean {
    try {
      const now = Date.now();
      const currentCooldown = this.calculateAttackCooldown();

      // Check cooldown
      if (now - this.lastAttackTime < currentCooldown) {
        return false;
      }

      const gameScene = this.getGameScene();
      if (!gameScene) {
        return false;
      }

      const player = gameScene.playerCharacter;
      if (!player) {
        return false;
      }

      // Calculate actual distance
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.targetedEnemy.x,
        this.targetedEnemy.y
      );

      // Only attack if in range
      if (distance <= this.attackRange) {
        // Default to hit
        let doesHit = true;

        // Handle special case for archery weapons
        if (this.currentWeaponType === "archery") {
          // Archers have penalty at close range
          const adjacentDistance = 48; // About 1.5 tiles

          if (distance <= adjacentDistance) {
            // 25% chance to miss when adjacent
            doesHit = Math.random() >= 0.25;
          }
        }

        // Get attack damages (calculate regardless of hit/miss for event data)
        const attacks = this.calculateAttackDamages();

        // If the attack will hit, apply damage
        if (doesHit) {
          // Apply primary damage
          this.applyDamageToTarget(attacks.primary);
          this.showDamageNumber(
            this.targetedEnemy.x,
            this.targetedEnemy.y,
            attacks.primary,
            DamageType.PHYSICAL
          );

          // Emit primary damage event for skill progression
          eventBus.emit("damage.dealt", {
            source: "autoAttack",
            weaponType: this.currentWeaponType,
            targetType: "monster",
            targetId: this.targetedEnemy.monsterType || this.targetedEnemy.id,
            damage: attacks.primary,
          });

          // Apply secondary damage if it exists
          if (attacks.secondary) {
            this.applyDamageToTarget(attacks.secondary.damage);
            this.showDamageNumber(
              this.targetedEnemy.x + 15, // Slight offset so both numbers are visible
              this.targetedEnemy.y - 10,
              attacks.secondary.damage,
              attacks.secondary.type
            );

            // Emit secondary damage event for skill progression
            eventBus.emit("damage.dealt", {
              source: "autoAttack",
              weaponType: attacks.secondary.attackType,
              targetType: "monster",
              targetId: this.targetedEnemy.monsterType || this.targetedEnemy.id,
              damage: attacks.secondary.damage,
            });
          }

          // Play attack animation based on weapon type
          this.createAttackEffect(
            gameScene,
            player.x,
            player.y,
            this.targetedEnemy.x,
            this.targetedEnemy.y
          );
        }

        // Update last attack time
        this.lastAttackTime = now;

        // Emit attack animation event
        eventBus.emit("player.attack.performed", {
          weaponType: this.currentWeaponType,
          targetPosition: {
            x: this.targetedEnemy.x,
            y: this.targetedEnemy.y,
          },
          damage: doesHit ? attacks.primary : 0,
          didHit: doesHit,
          attackCooldown: currentCooldown, // Include current cooldown in event
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error in performAttack:", error);
      return false;
    }
  }

  /**
   * Get the active game scene
   */
  private getGameScene(): any {
    try {
      // First try to get from the store
      const store = useGameStore.getState();
      const systems = store.systems || {};

      if (systems.gameScene) {
        return systems.gameScene;
      }

      // Fallback to window.game if available
      if (window.game?.scene?.scenes) {
        const scenes = window.game.scene.scenes.filter(
          (s: any) => s.key === "game" && s.sys?.isActive()
        );

        if (scenes.length > 0) {
          return scenes[0];
        }
      }

      // Fallback to specific scene key
      if (window.game?.scene) {
        const gameScene = window.game.scene.getScene("game");
        if (gameScene) {
          return gameScene;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting game scene:", error);
      return null;
    }
  }

  /**
   * Apply damage to the target
   */
  private applyDamageToTarget(damage: number): void {
    // Direct damage application if takeDamage is available
    if (this.targetedEnemy && typeof this.targetedEnemy.takeDamage === "function") {
      this.targetedEnemy.takeDamage(damage);
      return;
    }

    // Fallback to event emission
    eventBus.emit("monster.damage.taken", {
      targetId: this.targetedEnemy.id,
      damage: damage,
      source: "player",
      weaponType: this.currentWeaponType,
    });
  }

  /**
   * Create attack effects based on weapon type
   */
  private createAttackEffect(
    gameScene: any,
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): void {
    try {
      switch (this.currentWeaponType) {
        case "melee":
          this.createMeleeEffect(gameScene, playerX, playerY, targetX, targetY);
          break;
        case "archery":
          this.createArcheryEffect(gameScene, playerX, playerY, targetX, targetY);
          break;
        case "magic":
          this.createMagicEffect(gameScene, playerX, playerY, targetX, targetY);
          break;
      }
    } catch (error) {
      console.error("Error creating attack effect:", error);
    }
  }

  /**
   * Create melee attack visual effect
   */
  private createMeleeEffect(
    gameScene: any,
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): void {
    try {
      // Simple slash effect
      const graphics = gameScene.add.graphics();
      graphics.lineStyle(3, 0x6ab5ff, 0.8);
      graphics.beginPath();
      graphics.moveTo(playerX, playerY);
      graphics.lineTo(targetX, targetY);
      graphics.strokePath();
      graphics.setDepth(5);

      // Fade out the effect
      gameScene.tweens.add({
        targets: graphics,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          graphics.destroy();
        },
      });
    } catch (error) {
      console.error("Error in createMeleeEffect:", error);
    }
  }

  /**
   * Create archery attack visual effect
   */
  private createArcheryEffect(
    gameScene: any,
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): void {
    try {
      // Create arrow projectile
      const arrow = gameScene.add.rectangle(playerX, playerY, 20, 3, 0x8b4513);
      arrow.setDepth(5);

      // Calculate angle and rotation
      const angle = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);
      arrow.setRotation(angle);

      // Animate arrow to target
      gameScene.tweens.add({
        targets: arrow,
        x: targetX,
        y: targetY,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          arrow.destroy();
        },
      });
    } catch (error) {
      console.error("Error in createArcheryEffect:", error);
    }
  }

  /**
   * Create magic attack visual effect
   */
  private createMagicEffect(
    gameScene: any,
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): void {
    try {
      // Create magic missile
      const missile = gameScene.add.circle(playerX, playerY, 8, 0x9c27b0, 0.8);
      missile.setDepth(5);

      // Add glow effect
      const glow = gameScene.add.circle(playerX, playerY, 12, 0x9c27b0, 0.3);
      glow.setDepth(4);

      // Animate both missile and glow to target
      gameScene.tweens.add({
        targets: [missile, glow],
        x: targetX,
        y: targetY,
        duration: 400,
        ease: "Power2",
        onComplete: () => {
          missile.destroy();
          glow.destroy();
        },
      });
    } catch (error) {
      console.error("Error in createMagicEffect:", error);
    }
  }

  /**
   * Check if auto-attack is currently active
   */
  isActive(): boolean {
    return this.isAutoAttacking && this.targetedEnemy !== null;
  }

  /**
   * Get the current target
   */
  getCurrentTarget(): any | null {
    return this.targetedEnemy;
  }

  /**
   * Get the current weapon type
   */
  getCurrentWeaponType(): string {
    return this.currentWeaponType;
  }

  /**
   * Update method to be called by the game loop
   */
  update(): void {
    // Perform attack if attacking
    if (this.isAutoAttacking && this.targetedEnemy) {
      this.performAttack();
    }
  }

  dispose(): void {
    // Clean up store subscription
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    // Clean up event listeners
    eventBus.off("monster.died", this.handleMonsterDeath);

    // Clear state
    this.clearTarget();
  }
}

// Add type definition for window.game
declare global {
  interface Window {
    game?: any;
  }
}

// Create and export singleton instance
export const autoAttackSystem = new AutoAttackSystemService();
