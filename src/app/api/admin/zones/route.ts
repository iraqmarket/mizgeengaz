import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/zones - Get all delivery zones
export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error("Error fetching zones:", error)
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    )
  }
}

// POST /api/admin/zones - Create new delivery zone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, coordinates, deliveryFee, description, isActive = true } = body

    if (!name || !color || !coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: "Name, color, and coordinates are required" },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        color,
        coordinates,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null,
        description,
        isActive
      }
    })

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating zone:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A zone with this name already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create zone" },
      { status: 500 }
    )
  }
}