import { prisma } from "./prisma"

// Get Google Maps API key from settings
export async function getGoogleMapsApiKey(): Promise<string | null> {
  try {
    const settings = await prisma.appSettings.findFirst({
      select: { googleMapsApiKey: true }
    })
    return settings?.googleMapsApiKey || null
  } catch (error) {
    console.error("Error fetching Google Maps API key:", error)
    return null
  }
}

// Get map configuration
export async function getMapConfig() {
  try {
    const settings = await prisma.appSettings.findFirst()
    return {
      apiKey: settings?.googleMapsApiKey || null,
      defaultLat: settings?.mapDefaultLat || 33.3152, // Baghdad
      defaultLng: settings?.mapDefaultLng || 44.3661, // Baghdad
      deliveryRadius: settings?.deliveryRadius || 25 // 25km
    }
  } catch (error) {
    console.error("Error fetching map config:", error)
    return {
      apiKey: null,
      defaultLat: 33.3152,
      defaultLng: 44.3661,
      deliveryRadius: 25
    }
  }
}