import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface Params {
  params: {
    id: string
  }
}

// GET /api/driver/orders/[id] - Get specific order details for driver
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
      where: { email: session.user.email },
      include: {
        driver: true
      }
    })

    if (!user || !user.driver || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: params.id,
        driverId: user.driver.id // Ensure driver can only access their assigned orders
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
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

// PUT /api/driver/orders/[id] - Update order status by driver
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
      where: { email: session.user.email },
      include: {
        driver: true
      }
    })

    if (!user || !user.driver || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Find the order and verify it's assigned to this driver
    const existingOrder = await prisma.order.findFirst({
      where: { 
        id: params.id,
        driverId: user.driver.id
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let driverStatusUpdate: any = {}

    // Handle different actions
    if (action === 'start_delivery') {
      if (existingOrder.status !== 'ASSIGNED') {
        return NextResponse.json(
          { error: "Can only start delivery for assigned orders" },
          { status: 400 }
        )
      }
      updateData.status = 'IN_TRANSIT'
      driverStatusUpdate.status = 'BUSY'
    } else if (action === 'complete_delivery') {
      if (existingOrder.status !== 'IN_TRANSIT') {
        return NextResponse.json(
          { error: "Can only complete orders that are in transit" },
          { status: 400 }
        )
      }
      updateData.status = 'DELIVERED'
      updateData.deliveredAt = new Date()
      driverStatusUpdate.status = 'AVAILABLE'
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    })

    // Update driver status if needed
    if (Object.keys(driverStatusUpdate).length > 0) {
      await prisma.driver.update({
        where: { id: user.driver.id },
        data: driverStatusUpdate
      })
    }

    let message = ""
    if (action === 'start_delivery') {
      message = "Delivery started successfully"
    } else if (action === 'complete_delivery') {
      message = "Delivery completed successfully"
    }

    return NextResponse.json({ order, message })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}