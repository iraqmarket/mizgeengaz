import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface Params {
  params: {
    id: string
  }
}

// GET /api/orders/[id] - Get specific order details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: params.id,
        userId: user.id // Ensure user can only access their own orders
      },
      include: {
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

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order (for cancellation, etc.)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find the order and verify ownership
    const existingOrder = await prisma.order.findFirst({
      where: { 
        id: params.id,
        userId: user.id
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Handle different actions
    if (action === 'cancel') {
      // Only allow cancellation if order is not yet in transit or delivered
      if (['IN_TRANSIT', 'DELIVERED'].includes(existingOrder.status)) {
        return NextResponse.json(
          { error: "Cannot cancel order that is already in transit or delivered" },
          { status: 400 }
        )
      }

      const order = await prisma.order.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
        include: {
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

      return NextResponse.json({ order, message: "Order cancelled successfully" })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}