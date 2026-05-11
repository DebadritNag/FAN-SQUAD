/**
 * Pure function implementing the card swipe overlay interpolation logic.
 *
 * - translateX > 0 (rightward): greenOpacity interpolated [0,120] → [0,0.6], redOpacity = 0
 * - translateX < 0 (leftward):  redOpacity interpolated [-120,0] → [0.6,0], greenOpacity = 0
 * - translateX === 0: both opacities are 0
 */
export function getSwipeOverlayOpacities(translateX: number): {
  greenOpacity: number;
  redOpacity: number;
} {
  if (translateX > 0) {
    // Rightward swipe — green overlay
    const greenOpacity = Math.min((translateX / 120) * 0.6, 0.6);
    return { greenOpacity, redOpacity: 0 };
  }

  if (translateX < 0) {
    // Leftward swipe — red overlay
    const redOpacity = Math.min((Math.abs(translateX) / 120) * 0.6, 0.6);
    return { greenOpacity: 0, redOpacity };
  }

  // translateX === 0
  return { greenOpacity: 0, redOpacity: 0 };
}
