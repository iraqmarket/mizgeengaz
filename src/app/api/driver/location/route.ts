import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/driver/location - Get driver location and status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        driver: true
      }
    })

    if (!user || !user.driver || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    const driver = {
      currentLat: user.driver.currentLat,
      currentLng: user.driver.currentLng,
      status: user.driver.status,
      lastUpdated: user.driver.updatedAt
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error("Error fetching driver location:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver location" },
      { status: 500 }
    )
  }
}

// PUT /api/driver/location - Update driver location
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentLat, currentLng } = body

    if (currentLat === undefined || currentLng === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        driver: true
      }
    })

    if (!user || !user.driver || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Update driver location
    const updatedDriver = await prisma.driver.update({
      where: { id: user.driver.id },
      data: {
        currentLat: parseFloat(currentLat),
        currentLng: parseFloat(currentLng)
      }
    })

    return NextResponse.json({ 
      message: "Location updated successfully",
      currentLat: updatedDriver.currentLat,
      currentLng: updatedDriver.currentLng
    })
  } catch (error) {
    console.error("Error updating driver location:", error)
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    )
  }
}