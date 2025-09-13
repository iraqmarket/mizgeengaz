export interface DeliveryZone {
  id: string
  name: string
  color: string
  coordinates: Array<{ lat: number; lng: number }>
  deliveryFee?: number
  description?: string
}

export interface LocationPoint {
  lat: number
  lng: number
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point - The point to check
 * @param polygon - Array of polygon vertices
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(point: LocationPoint, polygon: LocationPoint[]): boolean {
  console.log('🔍 [Zones] Checking if point is in polygon:', { point, polygonVertices: polygon.length })

  if (polygon.length < 3) {
    console.log('❌ [Zones] Polygon has less than 3 vertices, returning false')
    return false
  }

  let inside = false
  const { lat: x, lng: y } = point

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: xi, lng: yi } = polygon[i]
    const { lat: xj, lng: yj } = polygon[j]

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }

  console.log(`${inside ? '✅' : '❌'} [Zones] Point is ${inside ? 'inside' : 'outside'} polygon`)
  return inside
}

/**
 * Find which delivery zone contains the given point
 * @param point - The location point to check
 * @param zones - Array of delivery zones
 * @returns The zone containing the point, or null if not in any zone
 */
export function findZoneForLocation(point: LocationPoint, zones: DeliveryZone[]): DeliveryZone | null {
  console.log('🌍 [Zones] Finding zone for location:', point)
  console.log('📋 [Zones] Checking against', zones.length, 'zones')

  for (const zone of zones) {
    console.log(`🔍 [Zones] Checking zone: ${zone.name} (${zone.coordinates.length} coordinates)`)
    if (isPointInPolygon(point, zone.coordinates)) {
      console.log(`✅ [Zones] Found matching zone: ${zone.name}`)
      return zone
    }
  }

  console.log('❌ [Zones] No matching zone found for location')
  return null
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find the nearest delivery zone to a given point
 * @param point - The location point
 * @param zones - Array of delivery zones
 * @returns Object with nearest zone and distance, or null if no zones
 */
export function findNearestZone(point: LocationPoint, zones: DeliveryZone[]): { zone: DeliveryZone; distance: number } | null {
  if (zones.length === 0) return null

  let nearestZone: DeliveryZone | null = null
  let minDistance = Infinity

  for (const zone of zones) {
    // Calculate distance to zone center (average of all coordinates)
    const zoneCenterLat = zone.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / zone.coordinates.length
    const zoneCenterLng = zone.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / zone.coordinates.length

    const distance = calculateDistance(point, { lat: zoneCenterLat, lng: zoneCenterLng })

    if (distance < minDistance) {
      minDistance = distance
      nearestZone = zone
    }
  }

  return nearestZone ? { zone: nearestZone, distance: minDistance } : null
}

/**
 * Validate if a location is serviceable
 * @param point - The location point
 * @param zones - Array of delivery zones
 * @returns Validation result with zone info and suggestions
 */
export function validateLocationForDelivery(point: LocationPoint, zones: DeliveryZone[]) {
  console.log('🔍 [Zones] Validating location for delivery:', point)
  console.log('📊 [Zones] Available zones for validation:', zones.map(z => ({ id: z.id, name: z.name })))

  const containingZone = findZoneForLocation(point, zones)

  if (containingZone) {
    console.log('✅ [Zones] Location is serviceable in zone:', containingZone.name)
    return {
      isServiceable: true,
      zone: containingZone,
      message: `Great! Your location is in the ${containingZone.name} delivery zone.`,
      deliveryFee: containingZone.deliveryFee || 0
    }
  }

  console.log('❌ [Zones] Location is not in any delivery zone, finding nearest...')
  const nearestZone = findNearestZone(point, zones)

  const result = {
    isServiceable: false,
    zone: null,
    nearestZone: nearestZone?.zone || null,
    distance: nearestZone?.distance || null,
    message: nearestZone
      ? `Your location is outside our delivery zones. The nearest zone is ${nearestZone.zone.name} (${nearestZone.distance.toFixed(1)} km away).`
      : 'Your location is outside our delivery zones.',
    suggestions: nearestZone
      ? [`Consider choosing a location closer to ${nearestZone.zone.name}`, 'Contact us for delivery to your area']
      : ['Contact us to check if we can deliver to your area']
  }

  console.log('📋 [Zones] Validation result:', result)
  return result
}