import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/driver/profile - Get driver profile
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      },
      licenseNumber: user.driver.licenseNumber,
      vehicleType: user.driver.vehicleType,
      vehiclePlate: user.driver.vehiclePlate,
      status: user.driver.status,
      createdAt: user.driver.createdAt
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error("Error fetching driver profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver profile" },
      { status: 500 }
    )
  }
}

// PUT /api/driver/profile - Update driver profile
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
    const { name, phoneNumber, licenseNumber, vehicleType, vehiclePlate } = body

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

    // Update user information
    if (name || phoneNumber) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
        }
      })
    }

    // Update driver information
    const updatedDriver = await prisma.driver.update({
      where: { id: user.driver.id },
      data: {
        ...(licenseNumber && { licenseNumber }),
        ...(vehicleType && { vehicleType }),
        ...(vehiclePlate && { vehiclePlate }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      driver: {
        user: updatedDriver.user,
        licenseNumber: updatedDriver.licenseNumber,
        vehicleType: updatedDriver.vehicleType,
        vehiclePlate: updatedDriver.vehiclePlate,
        status: updatedDriver.status,
        createdAt: updatedDriver.createdAt
      }
    })
  } catch (error: unknown) {
    console.error("Error updating driver profile:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "License number or vehicle plate already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update driver profile" },
      { status: 500 }
    )
  }
}