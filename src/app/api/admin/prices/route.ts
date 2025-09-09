import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/prices - Get all prices
export async function GET() {
  try {
    const prices = await prisma.price.findMany({
      orderBy: {
        type: 'asc'
      }
    })

    return NextResponse.json({ prices })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}

// POST /api/admin/prices - Create new price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, basePrice, deliveryFee, isActive = true } = body

    if (!type || basePrice === undefined || deliveryFee === undefined) {
      return NextResponse.json(
        { error: "Tank type, base price, and delivery fee are required" },
        { status: 400 }
      )
    }

    const price = await prisma.price.create({
      data: {
        type,
        basePrice: parseFloat(basePrice),
        deliveryFee: parseFloat(deliveryFee),
        isActive
      }
    })

    return NextResponse.json({ price }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating price:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A price for this tank type already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create price" },
      { status: 500 }
    )
  }
}