/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Validate GPS check-in
 */
export function validateGPSCheckIn(params: {
  userLat: number;
  userLon: number;
  userAccuracy: number;
  activityLat: number;
  activityLon: number;
  radiusMeters: number;
  accuracyThreshold: number;
}): {
  status: 'accepted' | 'rejected' | 'pending';
  reason?: string;
  distance: number;
} {
  const {
    userLat,
    userLon,
    userAccuracy,
    activityLat,
    activityLon,
    radiusMeters,
    accuracyThreshold
  } = params;

  const distance = calculateDistance(userLat, userLon, activityLat, activityLon);

  // Check GPS accuracy first
  if (userAccuracy > accuracyThreshold) {
    return {
      status: 'pending',
      reason: `GPS accuracy too low (${userAccuracy.toFixed(0)}m). Please wait for better signal.`,
      distance
    };
  }

  // Check if within radius
  if (distance <= radiusMeters) {
    return {
      status: 'accepted',
      distance
    };
  } else {
    return {
      status: 'rejected',
      reason: `You are ${distance.toFixed(0)}m away from the activity location. Required: within ${radiusMeters}m.`,
      distance
    };
  }
}

/**
 * Check if current time is within activity time window
 */
export function isWithinTimeWindow(startTime: Date, endTime: Date): boolean {
  const now = new Date();
  return now >= startTime && now <= endTime;
}
