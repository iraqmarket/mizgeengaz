import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/driver/orders - Get driver's assigned orders
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
        driver: {
          include: {
            assignedZone: true
          }
        }
      }
    })

    if (!user || !user.driver || user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    console.log('🚚 [Driver Orders] Driver info:')
    console.log('   - Driver ID:', user.driver.id)
    console.log('   - Driver assigned zone ID:', user.driver.assignedZoneId)
    console.log('   - Driver assigned zone name:', user.driver.assignedZone?.name)

    // If driver has no assigned zone, return empty array
    if (!user.driver.assignedZoneId) {
      console.log('❌ [Driver Orders] Driver has no assigned zone')
      return NextResponse.json({
        orders: [],
        message: "No delivery zone assigned to this driver"
      })
    }

    console.log('🔍 [Driver Orders] Searching for orders in zone:', user.driver.assignedZoneId)

    // Get orders from the driver's assigned zone
    const orders = await prisma.order.findMany({
      where: {
        zoneId: user.driver.assignedZoneId,
        OR: [
          // Orders assigned to this driver (any status including delivered)
          { driverId: user.driver.id },
          // Unassigned orders in their zone that are available for pickup
          {
            driverId: null,
            status: { in: ['PENDING', 'CONFIRMED'] }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            mapPinLat: true,
            mapPinLng: true,
            address: true
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { driverId: 'desc' }, // Assigned orders first
        { createdAt: 'desc' }
      ]
    })

    console.log('📊 [Driver Orders] Query results:')
    console.log('   - Found orders:', orders.length)
    console.log('   - Order details:', orders.map(o => ({
      id: o.id,
      status: o.status,
      zoneId: o.zoneId,
      zoneName: o.zone?.name,
      driverId: o.driverId,
      customerName: o.user.name,
      deliveredAt: o.deliveredAt
    })))

    // Specifically log delivered orders for debugging
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED')
    console.log('📦 [Driver Orders] Delivered orders:', deliveredOrders.length)
    if (deliveredOrders.length > 0) {
      console.log('   - Delivered order IDs:', deliveredOrders.map(o => o.id))
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error fetching driver orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}