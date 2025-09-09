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

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        tankSize: tankType, // Using tankSize field to store the type for now
        quantity: parseInt(quantity),
        totalPrice,
        deliveryAddress,
        phoneNumber,
        status: 'PENDING'
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