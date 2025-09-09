'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface OrderDetails {
  id: string
  userId: string
  driverId?: string
  driver?: {
    user: {
      name: string
      phoneNumber?: string
    }
    vehicleType: string
    vehiclePlate: string
    currentLat?: number
    currentLng?: number
  }
  tankSize: string
  quantity: number
  totalPrice: number
  deliveryAddress: string
  phoneNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  scheduledAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'ASSIGNED', label: 'Driver Assigned', icon: User },
  { key: 'IN_TRANSIT', label: 'On the Way', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
]

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        } else {
          if (response.status === 401) {
            router.push("/auth/signin")
          } else if (response.status === 404) {
            toast.error('Order not found')
            router.push("/orders")
          } else {
            toast.error('Failed to load order details')
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        toast.error('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [session, params.id, router])

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'upcoming'
    
    const currentIndex = statusSteps.findIndex(step => step.key === order.status)
    const stepIndex = statusSteps.findIndex(step => step.key === stepKey)
    
    if (order.status === 'CANCELLED') {
      return stepIndex === 0 ? 'completed' : 'cancelled'
    }
    
    if (stepIndex <= currentIndex) return 'completed'
    if (stepIndex === currentIndex + 1) return 'current'
    return 'upcoming'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading order details...</span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/orders">
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/orders"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Orders</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Order {order.id}</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {session?.user?.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon
                  const status = getStepStatus(step.key)
                  
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${status === 'completed' ? 'bg-green-100 text-green-600' :
                          status === 'current' ? 'bg-blue-100 text-blue-600' :
                          status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-400'}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          status === 'completed' ? 'text-green-700' :
                          status === 'current' ? 'text-blue-700' :
                          status === 'cancelled' ? 'text-red-700' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {status === 'current' && (
                          <p className="text-xs text-blue-600">In Progress</p>
                        )}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`w-px h-8 ml-5 ${
                          status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tank Type:</span>
                  <span className="font-medium">{order.tankSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-semibold text-lg">{order.totalPrice.toLocaleString()} IQD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-GB')} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm">Delivery Address:</label>
                  <p className="font-medium mt-1">{order.deliveryAddress}</p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm">Contact Phone:</label>
                  <p className="font-medium mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {order.phoneNumber}
                  </p>
                </div>
                {order.scheduledAt && (
                  <div>
                    <label className="text-gray-600 text-sm">Scheduled Delivery:</label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(order.scheduledAt).toLocaleDateString('en-GB')} at{' '}
                      {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Driver Information */}
          {order.driver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-gray-600 text-sm">Driver Name:</label>
                    <p className="font-medium mt-1">{order.driver.user.name}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Vehicle:</label>
                    <p className="font-medium mt-1">{order.driver.vehicleType}</p>
                    <p className="text-sm text-gray-500">{order.driver.vehiclePlate}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Driver Contact:</label>
                    {order.driver.user.phoneNumber ? (
                      <p className="font-medium mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {order.driver.user.phoneNumber}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic mt-1">Not available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Need help with this order?</h3>
                  <p className="text-gray-600">Contact our customer support team</p>
                </div>
                <div className="flex items-center gap-3">
                  {order.status === 'PENDING' && (
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Cancel Order
                    </Button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Reorder
                    </Button>
                  )}
                  <Button variant="outline">
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Orders */}
          <div className="text-center pt-4">
            <Link href="/orders">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Order History
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}