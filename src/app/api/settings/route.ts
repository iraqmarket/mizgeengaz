import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get the first (and should be only) settings record
    let settings = await prisma.appSettings.findFirst()
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          mapDefaultLat: 33.3152, // Baghdad coordinates
          mapDefaultLng: 44.3661,
          deliveryRadius: 50, // 50km default radius
        }
      })
    }

    return NextResponse.json({
      googleMapsApiKey: settings.googleMapsApiKey,
      mapDefaultLat: settings.mapDefaultLat,
      mapDefaultLng: settings.mapDefaultLng,
      deliveryRadius: settings.deliveryRadius,
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}