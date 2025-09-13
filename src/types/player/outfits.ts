/**
 * Player outfit and customization types
 */

/**
 * Individual outfit data structure
 */
export interface OutfitData {
  id: string;
  name: string;
  sprite: string; // Sprite key for Phaser
  description?: string;
  isUnlocked: boolean;
  isDefault?: boolean;
  unlockSource?: string; // "default", "skeletal_set", "quest_reward", etc.
  previewImage?: string; // Path to preview image
}

/**
 * Outfit system state
 */
export interface OutfitState {
  currentOutfit: string; // Current outfit ID
  currentTint: number; // Current tint color as hex number
  availableOutfits: Record<string, OutfitData>; // All outfit definitions
  unlockedOutfitIds: string[]; // Array of unlocked outfit IDs
}

/**
 * Color option for outfit tinting
 */
export interface ColorOption {
  name: string;
  value: number;
  color: string;
}

/**
 * Outfit change event data
 */
export interface OutfitChangedEvent {
  outfitId: string;
  sprite: string;
  tint: number;
}

/**
 * Outfit unlock event data
 */
export interface OutfitUnlockedEvent {
  outfitId: string;
  outfit: OutfitData;
}
