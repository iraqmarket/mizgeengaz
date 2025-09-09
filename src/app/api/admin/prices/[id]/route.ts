import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: {
    id: string
  }
}

// GET /api/admin/prices/[id] - Get specific price
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const price = await prisma.price.findUnique({
      where: { id: params.id }
    })

    if (!price) {
      return NextResponse.json(
        { error: "Price not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ price })
  } catch (error) {
    console.error("Error fetching price:", error)
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/prices/[id] - Update price
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { type, basePrice, deliveryFee, isActive } = body

    const price = await prisma.price.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(deliveryFee !== undefined && { deliveryFee: parseFloat(deliveryFee) }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json({ price })
  } catch (error: unknown) {
    console.error("Error updating price:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A price for this tank type already exists" },
        { status: 400 }
      )
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Price not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prices/[id] - Delete price
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await prisma.price.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Price deleted successfully" })
  } catch (error: unknown) {
    console.error("Error deleting price:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Price not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete price" },
      { status: 500 }
    )
  }
}