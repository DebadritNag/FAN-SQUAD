/**
 * Converts a total number of seconds into a MM:SS formatted string.
 *
 * Both minutes and seconds are zero-padded to 2 digits.
 *
 * @example
 * formatCountdown(90)   // '01:30'
 * formatCountdown(0)    // '00:00'
 * formatCountdown(5999) // '99:59'
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}
