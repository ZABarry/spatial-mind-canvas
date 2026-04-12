/**
 * Hand-tracking “lite” policy: prefer reliable flows (select, inspect, place) and hide brittle ones.
 */
export function hideAdvancedAuthoringForHandTracking(xrHandTrackingPrimary: boolean): boolean {
  return xrHandTrackingPrimary
}
