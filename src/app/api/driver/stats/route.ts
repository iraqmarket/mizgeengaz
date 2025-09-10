import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/driver/stats - Get driver statistics
export async function GET() {
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

    // Get driver's order statistics
    const totalDeliveries = await prisma.order.count({
      where: {
        driverId: user.driver.id,
        status: 'DELIVERED'
      }
    })

    // Get today's deliveries
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayDeliveries = await prisma.order.count({
      where: {
        driverId: user.driver.id,
        status: 'DELIVERED',
        deliveredAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        driverId: user.driver.id,
        status: {
          in: ['ASSIGNED', 'IN_TRANSIT']
        }
      }
    })

    // Calculate today's earnings (simplified - could be enhanced with delivery fees)
    const todayOrders = await prisma.order.findMany({
      where: {
        driverId: user.driver.id,
        status: 'DELIVERED',
        deliveredAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const earnings = todayOrders.reduce((sum, order) => sum + (order.totalPrice * 0.1), 0) // 10% commission

    const stats = {
      totalDeliveries,
      todayDeliveries,
      pendingOrders,
      earnings: Math.round(earnings),
      status: user.driver.status
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching driver stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver stats" },
      { status: 500 }
    )
  }
}