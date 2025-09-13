/**
 * Skill and progression types
 */

/**
 * Individual skill data structure
 */
export interface SkillData {
  level: number;
  experience: number;
  maxExperience: number;
}

/**
 * Skill update event data for progression tracking
 */
export interface SkillUpdatedEvent {
  skillId: string;
  level: number;
  experience: number;
  maxExperience: number;
  leveledUp: boolean;
}
