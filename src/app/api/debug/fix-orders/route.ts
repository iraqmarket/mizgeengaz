import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// One-time fix to update existing orders with missing zone IDs
export async function POST() {
  try {
    console.log('🔧 [Fix] Starting to fix orders with missing zone IDs...')

    // Find all orders without zone IDs but where the user has a zone
    const ordersToFix = await prisma.order.findMany({
      where: {
        zoneId: null,
        user: {
          zoneId: {
            not: null
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            zoneId: true,
            zone: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    console.log(`📊 [Fix] Found ${ordersToFix.length} orders to fix`)

    let fixedCount = 0
    for (const order of ordersToFix) {
      console.log(`🔄 [Fix] Fixing order ${order.id}:`)
      console.log(`   - User: ${order.user.email}`)
      console.log(`   - Setting zoneId to: ${order.user.zoneId}`)
      console.log(`   - Zone name: ${order.user.zone?.name}`)

      await prisma.order.update({
        where: { id: order.id },
        data: {
          zoneId: order.user.zoneId
        }
      })

      fixedCount++
    }

    console.log(`✅ [Fix] Successfully fixed ${fixedCount} orders`)

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} orders with missing zone IDs`,
      fixedOrders: ordersToFix.map(o => ({
        orderId: o.id,
        userEmail: o.user.email,
        zoneId: o.user.zoneId,
        zoneName: o.user.zone?.name
      }))
    })
  } catch (error) {
    console.error('❌ [Fix] Error fixing orders:', error)
    return NextResponse.json(
      { error: "Failed to fix orders" },
      { status: 500 }
    )
  }
}