import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: {
    id: string
  }
}

// GET /api/admin/drivers/[id] - Get specific driver
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        orders: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error("Error fetching driver:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/drivers/[id] - Update driver
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phoneNumber, 
      licenseNumber, 
      vehicleType, 
      vehiclePlate,
      status 
    } = body

    // Update user information
    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
      }
    })

    // Update driver information
    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: {
        ...(licenseNumber && { licenseNumber }),
        ...(vehicleType && { vehicleType }),
        ...(vehiclePlate && { vehiclePlate }),
        ...(status && { status }),
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

    return NextResponse.json({ driver })
  } catch (error: unknown) {
    console.error("Error updating driver:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email, license number, or vehicle plate already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/drivers/[id] - Delete driver
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Delete driver (this will cascade delete the user due to foreign key constraint)
    await prisma.driver.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Driver deleted successfully" })
  } catch (error: unknown) {
    console.error("Error deleting driver:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    )
  }
}