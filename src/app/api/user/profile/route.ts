import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile data including address and phone
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        addressType: true,
        address: true,
        mapPinLat: true,
        mapPinLng: true,
        complexName: true,
        buildingNumber: true,
        floorNumber: true,
        apartmentNumber: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Build formatted address for delivery
    let formattedAddress = user.address || ''
    
    if (user.addressType === 'APARTMENT' && user.address) {
      const addressParts = [user.address]
      
      if (user.complexName) addressParts.push(user.complexName)
      if (user.buildingNumber) addressParts.push(`Building ${user.buildingNumber}`)
      if (user.floorNumber) addressParts.push(`Floor ${user.floorNumber}`)
      if (user.apartmentNumber) addressParts.push(`Apt ${user.apartmentNumber}`)
      
      formattedAddress = addressParts.join(', ')
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        address: formattedAddress,
        addressType: user.addressType,
        hasCompleteProfile: !!(user.phoneNumber && user.address)
      }
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}