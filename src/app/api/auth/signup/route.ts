import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      name,
      password,
      phoneNumber,
      addressType,
      address,
      mapPinLat,
      mapPinLng,
      complexName,
      buildingNumber,
      floorNumber,
      apartmentNumber,
      city,
      neighborhood,
      businessName,
      zoneId
    } = await request.json()

    // Debug log received data
    console.log('📥 [Signup API] Received signup data:')
    console.log('   - Email:', email)
    console.log('   - Name:', name)
    console.log('   - Address:', address)
    console.log('   - Coordinates:', mapPinLat, mapPinLng)
    console.log('   - Zone ID:', zoneId)

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phoneNumber,
        addressType,
        address,
        mapPinLat,
        mapPinLng,
        complexName,
        buildingNumber,
        floorNumber,
        apartmentNumber,
        city,
        neighborhood,
        businessName,
        zoneId,
      },
    })

    console.log('✅ [Signup API] User created successfully:')
    console.log('   - User ID:', user.id)
    console.log('   - Email:', user.email)
    console.log('   - Address saved:', address)
    console.log('   - Coordinates saved:', mapPinLat, mapPinLng)
    console.log('   - Zone ID saved:', zoneId)

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user.id, email: user.email, name: user.name, zoneId: zoneId }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}