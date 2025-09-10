// Predefined villages and areas in Dahuk Governorate
export const dahukLocations = [
  // Dahuk City Districts
  { name: 'Dahuk City Center', lat: 36.8572, lng: 43.0076, type: 'district' },
  { name: 'Azadi District', lat: 36.8650, lng: 43.0150, type: 'district' },
  { name: 'Baroshke', lat: 36.8480, lng: 43.0200, type: 'district' },
  { name: 'Masike', lat: 36.8700, lng: 42.9950, type: 'district' },
  { name: 'Shindokha', lat: 36.8620, lng: 42.9900, type: 'district' },
  { name: 'Zirka', lat: 36.8550, lng: 43.0250, type: 'district' },
  { name: 'Barzan Quarter', lat: 36.8680, lng: 43.0100, type: 'district' },
  { name: 'Sarhildan', lat: 36.8750, lng: 43.0050, type: 'district' },
  
  // Nearby Towns and Villages
  { name: 'Semel', lat: 36.8583, lng: 42.8511, type: 'town' },
  { name: 'Zakho', lat: 37.1441, lng: 42.6821, type: 'city' },
  { name: 'Amadiya', lat: 37.0925, lng: 43.4873, type: 'town' },
  { name: 'Akre', lat: 36.7436, lng: 43.8920, type: 'town' },
  { name: 'Bardarash', lat: 36.5117, lng: 43.5556, type: 'town' },
  { name: 'Sheikhan', lat: 36.6964, lng: 43.3522, type: 'town' },
  
  // Villages around Dahuk
  { name: 'Malta', lat: 36.8900, lng: 43.0300, type: 'village' },
  { name: 'Sharya', lat: 36.7950, lng: 42.9800, type: 'village' },
  { name: 'Bersive', lat: 36.9200, lng: 43.0500, type: 'village' },
  { name: 'Zawite', lat: 36.8950, lng: 42.9600, type: 'village' },
  { name: 'Sarsink', lat: 37.0450, lng: 43.3500, type: 'village' },
  { name: 'Deralok', lat: 37.2700, lng: 43.2000, type: 'village' },
  { name: 'Mangesh', lat: 36.8300, lng: 43.1000, type: 'village' },
  { name: 'Baadre', lat: 36.7800, lng: 43.0500, type: 'village' },
  { name: 'Kani Masi', lat: 37.0000, lng: 43.0800, type: 'village' },
  { name: 'Bamerne', lat: 37.1100, lng: 43.2700, type: 'village' },
  { name: 'Batifa', lat: 37.1700, lng: 42.8500, type: 'village' },
  { name: 'Qasrok', lat: 36.7300, lng: 42.8200, type: 'village' },
  { name: 'Dere', lat: 36.9100, lng: 43.3100, type: 'village' },
  { name: 'Dinarte', lat: 36.9500, lng: 43.1500, type: 'village' },
  
  // Sumel District Villages
  { name: 'Faida', lat: 36.8200, lng: 42.8300, type: 'village' },
  { name: 'Kalak', lat: 36.8100, lng: 42.8000, type: 'village' },
  { name: 'Domiz', lat: 36.8400, lng: 42.8450, type: 'village' },
  { name: 'Bajet Kandala', lat: 37.0850, lng: 42.4900, type: 'village' },
  { name: 'Ibrahim Khalil', lat: 37.0900, lng: 42.5600, type: 'border' },
  
  // Tourist and Commercial Areas
  { name: 'Dream City', lat: 36.8850, lng: 43.0200, type: 'commercial' },
  { name: 'Family Mall', lat: 36.8600, lng: 43.0100, type: 'commercial' },
  { name: 'Dahuk Dam', lat: 36.8780, lng: 43.0450, type: 'landmark' },
  { name: 'Gali Zanta', lat: 36.9200, lng: 43.1200, type: 'tourist' },
  { name: 'University of Dahuk', lat: 36.8550, lng: 42.9850, type: 'university' },
  { name: 'Dahuk General Hospital', lat: 36.8620, lng: 43.0050, type: 'hospital' },
  
  // Industrial Areas
  { name: 'Industrial Area', lat: 36.8300, lng: 42.9700, type: 'industrial' },
  { name: 'Dahuk Airport', lat: 36.8950, lng: 42.9300, type: 'airport' },
]

// Zone suggestions based on common delivery areas
export const suggestedZones = [
  {
    name: 'City Center Zone',
    description: 'Central Dahuk including main commercial areas',
    suggestedFee: 15000,
    color: '#3B82F6',
    villages: ['Dahuk City Center', 'Azadi District', 'Baroshke']
  },
  {
    name: 'Northern Suburbs',
    description: 'Northern residential areas including Malta and Bersive',
    suggestedFee: 18000,
    color: '#10B981',
    villages: ['Malta', 'Bersive', 'Masike']
  },
  {
    name: 'Western Zone',
    description: 'Semel district and surrounding villages',
    suggestedFee: 20000,
    color: '#F59E0B',
    villages: ['Semel', 'Faida', 'Domiz']
  },
  {
    name: 'Southern Zone',
    description: 'Southern areas including Sharya and industrial district',
    suggestedFee: 18000,
    color: '#8B5CF6',
    villages: ['Sharya', 'Industrial Area', 'Baadre']
  },
  {
    name: 'Tourist Areas',
    description: 'Tourist destinations and recreational areas',
    suggestedFee: 22000,
    color: '#EC4899',
    villages: ['Zawite', 'Dahuk Dam', 'Gali Zanta', 'Dream City']
  },
  {
    name: 'Zakho Road',
    description: 'Areas along the Zakho highway',
    suggestedFee: 25000,
    color: '#EF4444',
    villages: ['Batifa', 'Bajet Kandala', 'Ibrahim Khalil']
  },
  {
    name: 'Amadiya Road',
    description: 'Eastern areas towards Amadiya',
    suggestedFee: 25000,
    color: '#14B8A6',
    villages: ['Sarsink', 'Bamerne', 'Deralok']
  }
]

// Function to get zone boundary around a location
export function getZoneBoundary(centerLat: number, centerLng: number, radiusKm: number = 2) {
  const points = 8 // Number of points to create polygon
  const coordinates = []
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const latOffset = (radiusKm / 111) * Math.cos(angle) // 111km per degree latitude
    const lngOffset = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle)
    
    coordinates.push({
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset
    })
  }
  
  return coordinates
}