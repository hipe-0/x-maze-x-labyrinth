export function vibrate(pattern: number | number[]): void {
  try {
    const navigatorWithVibration = navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean
    }
    if (typeof navigatorWithVibration.vibrate === 'function') {
      navigatorWithVibration.vibrate(pattern)
    }
  } catch {
    // Vibration is a progressive enhancement.
  }
}
