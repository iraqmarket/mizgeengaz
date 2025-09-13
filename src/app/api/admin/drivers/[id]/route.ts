import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/drivers/[id] - Get specific driver
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const driver = await prisma.driver.findUnique({
      where: { id },
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
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      email, 
      phoneNumber, 
      licenseNumber, 
      vehicleType, 
      vehiclePlate,
      status,
      profileImage,
      assignedZoneId 
    } = body

    // First get the driver to get the userId
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingDriver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Prepare update data for user
    const userUpdateData: any = {}
    if (name) userUpdateData.name = name
    if (email) userUpdateData.email = email
    if (phoneNumber !== undefined) userUpdateData.phoneNumber = phoneNumber

    // Update user information if there's data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: existingDriver.userId },
        data: userUpdateData
      })
    }

    // Prepare update data for driver
    const driverUpdateData: any = {}
    if (licenseNumber) driverUpdateData.licenseNumber = licenseNumber
    if (vehicleType) driverUpdateData.vehicleType = vehicleType
    if (vehiclePlate) driverUpdateData.vehiclePlate = vehiclePlate
    if (status) driverUpdateData.status = status
    if (profileImage !== undefined) driverUpdateData.profileImage = profileImage
    if (assignedZoneId !== undefined) driverUpdateData.assignedZoneId = assignedZoneId

    // Update driver information
    const driver = await prisma.driver.update({
      where: { id },
      data: driverUpdateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        assignedZone: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
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
    const { id } = await params
    // First get the driver to get the userId
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingDriver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Delete driver first (this might have foreign key constraints)
    await prisma.driver.delete({
      where: { id }
    })

    // Then delete the associated user
    await prisma.user.delete({
      where: { id: existingDriver.userId }
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