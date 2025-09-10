import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/settings - Get application settings
export async function GET() {
  try {
    // Get the first (and should be only) settings record
    const settings = await prisma.appSettings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings - Create or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleMapsApiKey, mapDefaultLat, mapDefaultLng, deliveryRadius } = body

    if (!googleMapsApiKey?.trim()) {
      return NextResponse.json(
        { error: "Google Maps API key is required" },
        { status: 400 }
      )
    }

    // Check if settings already exist
    const existingSettings = await prisma.appSettings.findFirst()

    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.appSettings.update({
        where: { id: existingSettings.id },
        data: {
          googleMapsApiKey,
          mapDefaultLat: mapDefaultLat ? parseFloat(mapDefaultLat) : null,
          mapDefaultLng: mapDefaultLng ? parseFloat(mapDefaultLng) : null,
          deliveryRadius: deliveryRadius ? parseInt(deliveryRadius) : null
        }
      })
    } else {
      // Create new settings
      settings = await prisma.appSettings.create({
        data: {
          googleMapsApiKey,
          mapDefaultLat: mapDefaultLat ? parseFloat(mapDefaultLat) : null,
          mapDefaultLng: mapDefaultLng ? parseFloat(mapDefaultLng) : null,
          deliveryRadius: deliveryRadius ? parseInt(deliveryRadius) : null
        }
      })
    }

    // Return settings without exposing the full API key
    const safeSettings = {
      ...settings,
      googleMapsApiKey: settings.googleMapsApiKey ? 
        settings.googleMapsApiKey.substring(0, 8) + '...' + settings.googleMapsApiKey.slice(-4) : 
        null
    }

    return NextResponse.json({ settings: safeSettings }, { status: existingSettings ? 200 : 201 })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}