/**
 * Error handling types
 */

export interface ErrorData {
  error: Error;
  context: string;
  timestamp: number;
  handled: boolean;
}
