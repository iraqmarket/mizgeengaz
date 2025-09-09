import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/drivers - Get all drivers
export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
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
          select: {
            id: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    )
  }
}

// POST /api/admin/drivers - Create new driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      phoneNumber, 
      licenseNumber, 
      vehicleType, 
      vehiclePlate 
    } = body

    // Validate required fields
    if (!name || !email || !password || !licenseNumber || !vehicleType || !vehiclePlate) {
      return NextResponse.json(
        { error: "Name, email, password, license number, vehicle type, and vehicle plate are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      )
    }

    // Check if driver with this license already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { licenseNumber }
    })

    if (existingDriver) {
      return NextResponse.json(
        { error: "A driver with this license number already exists" },
        { status: 400 }
      )
    }

    // Check if vehicle with this plate already exists
    const existingVehicle = await prisma.driver.findUnique({
      where: { vehiclePlate }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: "A vehicle with this plate number already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user first
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        role: 'DRIVER'
      }
    })

    // Create driver record
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber,
        vehicleType,
        vehiclePlate,
        status: 'OFFLINE'
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

    return NextResponse.json({ driver }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating driver:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const field = error.meta && typeof error.meta === 'object' && 'target' in error.meta 
        ? error.meta.target 
        : 'unknown field'
      
      let message = "A record with this information already exists"
      
      if (Array.isArray(field) && field.includes('email')) {
        message = "A user with this email address already exists"
      } else if (Array.isArray(field) && field.includes('licenseNumber')) {
        message = "A driver with this license number already exists"
      } else if (Array.isArray(field) && field.includes('vehiclePlate')) {
        message = "A vehicle with this plate number already exists"
      }
      
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    )
  }
}