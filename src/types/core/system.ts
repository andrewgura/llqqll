/**
 * Core system management types
 */

/**
 * Common interface for all systems and components
 */
export interface SystemManager {
  initialize(): Promise<void>;
  destroy(): void;
}

/**
 * Enum for system initialization states
 */
export enum SystemState {
  UNINITIALIZED = "uninitialized",
  INITIALIZING = "initializing",
  INITIALIZED = "initialized",
  ERROR = "error",
}
