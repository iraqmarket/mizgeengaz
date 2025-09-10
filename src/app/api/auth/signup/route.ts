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
      businessName
    } = await request.json()

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
      },
    })

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: { id: user.id, email: user.email, name: user.name }
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