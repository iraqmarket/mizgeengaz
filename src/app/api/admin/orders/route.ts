import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/orders - Get all orders for admin
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phoneNumber: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

// POST /api/admin/orders - Create new order (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, driverId, tankSize, quantity, totalPrice, deliveryAddress, phoneNumber } = body

    if (!userId || !tankSize || !quantity || !totalPrice || !deliveryAddress || !phoneNumber) {
      return NextResponse.json(
        { error: "All order fields are required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      data: {
        userId,
        driverId,
        tankSize,
        quantity: parseInt(quantity),
        totalPrice: parseFloat(totalPrice),
        deliveryAddress,
        phoneNumber,
        status: driverId ? 'ASSIGNED' : 'PENDING'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phoneNumber: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}