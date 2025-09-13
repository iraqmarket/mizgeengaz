import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cleanAddressData } from "@/lib/address"

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
        city: true,
        neighborhood: true,
        zoneId: true,
        zone: {
          select: {
            id: true,
            name: true,
            color: true,
            deliveryFee: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Format the address better if it looks like coordinates
    let displayAddress = user.address

    console.log('🏠 [Profile API] Raw user data:')
    console.log('   - Raw Address:', user.address)
    console.log('   - City:', user.city)
    console.log('   - Neighborhood:', user.neighborhood)
    console.log('   - Zone:', user.zone?.name)
    console.log('   - Coordinates:', user.mapPinLat, user.mapPinLng)

    // Check if address looks like coordinates and needs formatting
    if (user.address && user.address.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
      // Address is coordinates, try to create a better display
      console.log('📍 [Profile API] Address appears to be coordinates, formatting...')
      if (user.city || user.neighborhood) {
        displayAddress = [user.neighborhood, user.city].filter(Boolean).join(', ')
        console.log('🏘️ [Profile API] Using city/neighborhood:', displayAddress)
      } else {
        // Don't use zone name for address - keep coordinates as fallback for now
        displayAddress = user.address // Keep coordinates as fallback
        console.log('📍 [Profile API] Keeping coordinates as fallback (not using zone name as address)')
      }
    } else if (user.address && user.address === user.zone?.name) {
      // Address is the same as zone name - this is wrong, we need to fix it
      console.log('⚠️ [Profile API] Address is same as zone name, this is incorrect!')
      if (user.city || user.neighborhood) {
        displayAddress = [user.neighborhood, user.city].filter(Boolean).join(', ')
        console.log('🏘️ [Profile API] Using city/neighborhood instead of zone name:', displayAddress)
      } else {
        displayAddress = `${user.mapPinLat?.toFixed(6)}, ${user.mapPinLng?.toFixed(6)}`
        console.log('📍 [Profile API] Using coordinates instead of zone name:', displayAddress)
      }
    } else {
      console.log('📍 [Profile API] Using raw address as-is:', displayAddress)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        address: displayAddress,
        rawAddress: user.address, // Keep original for editing
        addressType: user.addressType,
        mapPinLat: user.mapPinLat,
        mapPinLng: user.mapPinLng,
        complexName: user.complexName,
        buildingNumber: user.buildingNumber,
        floorNumber: user.floorNumber,
        apartmentNumber: user.apartmentNumber,
        city: user.city,
        neighborhood: user.neighborhood,
        zone: user.zone,
        hasCompleteProfile: !!(user.phoneNumber && user.address)
      }
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    console.log('Received profile update data:', body) // Debug logging
    
    const { 
      name, 
      phoneNumber, 
      addressType, 
      address, 
      mapPinLat, 
      mapPinLng,
      complexName,
      buildingNumber,
      floorNumber,
      apartmentNumber
    } = body

    // Find the user to update
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    console.log('Current user address before update:', existingUser.address) // Debug logging

    // Prepare clean update data
    const updateData = {
      name: name && name.trim() ? name.trim() : null,
      phoneNumber: phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : null,
      addressType: addressType || null,
      address: address && address.trim() ? address.trim() : null,
      mapPinLat: (mapPinLat !== undefined && mapPinLat !== null && mapPinLat !== '') ? parseFloat(mapPinLat) : null,
      mapPinLng: (mapPinLng !== undefined && mapPinLng !== null && mapPinLng !== '') ? parseFloat(mapPinLng) : null,
      // Always update apartment fields - set to null if empty or not apartment type
      complexName: (addressType === 'APARTMENT' && complexName && complexName.trim()) ? complexName.trim() : null,
      buildingNumber: (addressType === 'APARTMENT' && buildingNumber && buildingNumber.trim()) ? buildingNumber.trim() : null,
      floorNumber: (addressType === 'APARTMENT' && floorNumber && floorNumber.trim()) ? floorNumber.trim() : null,
      apartmentNumber: (addressType === 'APARTMENT' && apartmentNumber && apartmentNumber.trim()) ? apartmentNumber.trim() : null,
    }

    console.log('Update data being sent to database:', updateData) // Debug logging

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
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

    console.log('Database updated successfully. New address:', updatedUser.address) // Debug logging

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address, // Return raw address, not formatted
        addressType: updatedUser.addressType,
        mapPinLat: updatedUser.mapPinLat,
        mapPinLng: updatedUser.mapPinLng,
        complexName: updatedUser.complexName,
        buildingNumber: updatedUser.buildingNumber,
        floorNumber: updatedUser.floorNumber,
        apartmentNumber: updatedUser.apartmentNumber,
        hasCompleteProfile: !!(updatedUser.phoneNumber && updatedUser.address)
      }
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}