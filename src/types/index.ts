// src/types/index.ts
/**
 * Central types export file
 * All type definitions are organized into categorized modules for better maintainability
 */

// Core system types
export * from "./core/system";
export * from "./core/errors";

// Player types
export * from "./player/character";
export * from "./player/skills";
export * from "./player/stats";
export * from "./player/outfits";

// Item system types
export * from "./items/base";

// Quest system types
export * from "./quests/base";
export * from "./quests/definitions";
export * from "./quests/rewards";

// Monster types
export * from "./monsters";

// Combat types
export * from "./combat";

// UI types
export * from "./ui";

// Game state types
export * from "./game/state";

// NPC
export * from "./npc";
