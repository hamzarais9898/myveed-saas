/**
 * Normalizes a progress value directly into a safe 0-100 percentage integer.
 * Handles edge cases like null, undefined, strings, negatives, and excessive values (e.g., 4000).
 * Applies a x100 scaling ONLY if the original value is definitively between 0 and 1.
 * 
 * @param value - The raw progress value (could be 0.4, "40", 4000, null)
 * @returns A safe integer between 0 and 100
 */
export function normalizeProgress(value: any): number {
    if (value == null || isNaN(value)) return 0;
  
    let progress = Number(value);
  
    // If progress is natively between 0 and 1 (non-zero), assume it's a decimal percentage (0.4 => 40)
    if (progress > 0 && progress <= 1) {
      progress = Math.round(progress * 100);
    }
  
    // Clamp the value strictly between 0 and 100 and ensure it is an integer
    return Math.max(0, Math.min(100, Math.round(progress)));
}
