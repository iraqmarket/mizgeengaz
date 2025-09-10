import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: {
    id: string
  }
}

// GET /api/admin/zones/[id] - Get specific zone
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true
          }
        }
      }
    })

    if (!zone) {
      return NextResponse.json(
        { error: "Zone not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ zone })
  } catch (error) {
    console.error("Error fetching zone:", error)
    return NextResponse.json(
      { error: "Failed to fetch zone" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/zones/[id] - Update zone
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { name, color, coordinates, deliveryFee, description, isActive } = body

    const zone = await prisma.deliveryZone.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(coordinates && { coordinates }),
        ...(deliveryFee !== undefined && { deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json({ zone })
  } catch (error: unknown) {
    console.error("Error updating zone:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A zone with this name already exists" },
        { status: 400 }
      )
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Zone not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update zone" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/zones/[id] - Delete zone
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await prisma.deliveryZone.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Zone deleted successfully" })
  } catch (error: unknown) {
    console.error("Error deleting zone:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Zone not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete zone" },
      { status: 500 }
    )
  }
}