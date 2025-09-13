import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Debug endpoint to check all orders and their zone assignments
export async function GET() {
  try {
    console.log('🔍 [Debug] Fetching all orders with zone info...')

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        zone: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 [Debug] All orders in database:')
    orders.forEach((order, index) => {
      console.log(`   Order ${index + 1}:`)
      console.log(`     - ID: ${order.id}`)
      console.log(`     - Status: ${order.status}`)
      console.log(`     - Order zoneId: ${order.zoneId || 'NULL'}`)
      console.log(`     - Order zone name: ${order.zone?.name || 'No zone'}`)
      console.log(`     - User ID: ${order.userId}`)
      console.log(`     - User email: ${order.user.email}`)
      console.log(`     - User zoneId: ${order.user.zoneId || 'NULL'}`)
      console.log(`     - User zone name: ${order.user.zone?.name || 'No zone'}`)
      console.log(`     - Driver ID: ${order.driverId || 'Unassigned'}`)
      console.log(`     - Created: ${order.createdAt}`)
      console.log('---')
    })

    // Also get all drivers and their zone assignments
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        assignedZone: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('🚚 [Debug] All drivers and their zone assignments:')
    drivers.forEach((driver, index) => {
      console.log(`   Driver ${index + 1}:`)
      console.log(`     - ID: ${driver.id}`)
      console.log(`     - Name: ${driver.user.name}`)
      console.log(`     - Email: ${driver.user.email}`)
      console.log(`     - Assigned zone ID: ${driver.assignedZoneId || 'NULL'}`)
      console.log(`     - Assigned zone name: ${driver.assignedZone?.name || 'No zone'}`)
      console.log(`     - Status: ${driver.status}`)
      console.log('---')
    })

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        status: o.status,
        orderZoneId: o.zoneId,
        orderZoneName: o.zone?.name,
        userEmail: o.user.email,
        userZoneId: o.user.zoneId,
        userZoneName: o.user.zone?.name,
        driverId: o.driverId,
        createdAt: o.createdAt
      })),
      drivers: drivers.map(d => ({
        id: d.id,
        name: d.user.name,
        email: d.user.email,
        assignedZoneId: d.assignedZoneId,
        assignedZoneName: d.assignedZone?.name,
        status: d.status
      }))
    })
  } catch (error) {
    console.error('❌ [Debug] Error fetching debug data:', error)
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 }
    )
  }
}