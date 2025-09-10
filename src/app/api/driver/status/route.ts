import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// PUT /api/driver/status - Update driver status
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
    const { status } = body

    if (!['AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
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

    // Check if driver has active deliveries before going offline
    if (status === 'OFFLINE') {
      const activeDeliveries = await prisma.order.count({
        where: {
          driverId: user.driver.id,
          status: {
            in: ['ASSIGNED', 'IN_TRANSIT']
          }
        }
      })

      if (activeDeliveries > 0) {
        return NextResponse.json(
          { error: "Cannot go offline while you have active deliveries" },
          { status: 400 }
        )
      }
    }

    // Update driver status
    const updatedDriver = await prisma.driver.update({
      where: { id: user.driver.id },
      data: { status }
    })

    return NextResponse.json({ 
      message: "Status updated successfully",
      status: updatedDriver.status 
    })
  } catch (error) {
    console.error("Error updating driver status:", error)
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    )
  }
}