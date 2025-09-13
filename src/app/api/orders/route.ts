import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/orders - Get user's orders
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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
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

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tankType, quantity, deliveryAddress, phoneNumber } = body

    if (!tankType || !quantity || !deliveryAddress || !phoneNumber) {
      return NextResponse.json(
        { error: "Tank type, quantity, delivery address, and phone number are required" },
        { status: 400 }
      )
    }

    // Find user by email and include zone information
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        zone: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    console.log('📦 [Orders] Creating order for user:')
    console.log('   - User ID:', user.id)
    console.log('   - User zone ID:', user.zoneId)
    console.log('   - User zone name:', user.zone?.name)
    console.log('   - Tank type:', tankType)
    console.log('   - Quantity:', quantity)
    console.log('   - Delivery address:', deliveryAddress)

    // Find the price for the selected tank type
    const price = await prisma.price.findUnique({
      where: { type: tankType }
    })

    if (!price || !price.isActive) {
      return NextResponse.json(
        { error: "Invalid tank type or tank type not available" },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = (price.basePrice + price.deliveryFee) * quantity

    // Create the order with zone information
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        tankSize: tankType, // Using tankSize field to store the type for now
        quantity: parseInt(quantity),
        totalPrice,
        deliveryAddress,
        phoneNumber,
        status: 'PENDING',
        zoneId: user.zoneId // ← This is the key fix!
      }
    })

    console.log('✅ [Orders] Order created successfully:')
    console.log('   - Order ID:', order.id)
    console.log('   - Zone ID set to:', order.zoneId)
    console.log('   - Status:', order.status)

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}