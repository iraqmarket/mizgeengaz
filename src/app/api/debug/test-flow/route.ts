import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Test endpoint to verify the complete zone-based order flow
export async function GET() {
  try {
    console.log('🧪 [Test Flow] Testing complete zone-based order system...')

    // 1. Check zones
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true }
    })
    console.log(`✅ [Test Flow] Found ${zones.length} active zones`)

    // 2. Check users with zones
    const usersWithZones = await prisma.user.findMany({
      where: {
        zoneId: { not: null }
      },
      include: {
        zone: {
          select: { name: true }
        }
      }
    })
    console.log(`✅ [Test Flow] Found ${usersWithZones.length} users with zones assigned`)

    // 3. Check drivers with zone assignments
    const driversWithZones = await prisma.driver.findMany({
      where: {
        assignedZoneId: { not: null }
      },
      include: {
        assignedZone: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })
    console.log(`✅ [Test Flow] Found ${driversWithZones.length} drivers with zones assigned`)

    // 4. Check orders with zones
    const ordersWithZones = await prisma.order.findMany({
      where: {
        zoneId: { not: null },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: {
        zone: {
          select: { name: true }
        },
        user: {
          select: { email: true }
        }
      }
    })
    console.log(`✅ [Test Flow] Found ${ordersWithZones.length} orders with zones in PENDING/CONFIRMED status`)

    // 5. Test zone matching logic
    const zoneMatches = []
    for (const driver of driversWithZones) {
      const matchingOrders = ordersWithZones.filter(order =>
        order.zoneId === driver.assignedZoneId
      )

      zoneMatches.push({
        driverId: driver.id,
        driverName: driver.user.name,
        driverEmail: driver.user.email,
        assignedZone: driver.assignedZone?.name,
        matchingOrdersCount: matchingOrders.length,
        orderIds: matchingOrders.map(o => o.id)
      })

      console.log(`🎯 [Test Flow] Driver ${driver.user.name} (${driver.assignedZone?.name}) has ${matchingOrders.length} available orders`)
    }

    return NextResponse.json({
      success: true,
      summary: {
        activeZones: zones.length,
        usersWithZones: usersWithZones.length,
        driversWithZones: driversWithZones.length,
        availableOrders: ordersWithZones.length
      },
      zoneMatches,
      zones: zones.map(z => ({ id: z.id, name: z.name })),
      users: usersWithZones.map(u => ({
        email: u.email,
        zoneName: u.zone?.name
      })),
      drivers: driversWithZones.map(d => ({
        name: d.user.name,
        email: d.user.email,
        zoneName: d.assignedZone?.name
      })),
      orders: ordersWithZones.map(o => ({
        id: o.id,
        status: o.status,
        zoneName: o.zone?.name,
        userEmail: o.user.email
      }))
    })
  } catch (error) {
    console.error('❌ [Test Flow] Error testing flow:', error)
    return NextResponse.json(
      { error: "Failed to test flow" },
      { status: 500 }
    )
  }
}