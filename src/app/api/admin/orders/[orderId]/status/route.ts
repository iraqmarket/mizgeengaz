import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PUT /api/admin/orders/[orderId]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        updatedAt: new Date()
      },
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
      }
    })

    // If status is DELIVERED, update driver status to AVAILABLE
    if (status === 'DELIVERED' && updatedOrder.driverId) {
      await prisma.driver.update({
        where: { id: updatedOrder.driverId },
        data: { status: 'AVAILABLE' }
      })
    }

    // If status is IN_TRANSIT, update driver status to BUSY
    if (status === 'IN_TRANSIT' && updatedOrder.driverId) {
      await prisma.driver.update({
        where: { id: updatedOrder.driverId },
        data: { status: 'BUSY' }
      })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}