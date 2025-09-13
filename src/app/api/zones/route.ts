import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/zones - Public endpoint to get active delivery zones for signup/order placement
export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        color: true,
        coordinates: true,
        deliveryFee: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error("Error fetching public zones:", error)
    return NextResponse.json(
      { error: "Failed to fetch delivery zones" },
      { status: 500 }
    )
  }
}