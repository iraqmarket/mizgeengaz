'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Package, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ArrowLeft,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Order {
  id: string
  userId: string
  driverId?: string
  driver?: {
    user: {
      name: string
      phoneNumber?: string
    }
  }
  tankSize: string // This stores the tank type
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'IN_TRANSIT':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return <CheckCircle className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    case 'IN_TRANSIT':
      return <Truck className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function OrderHistory() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return // Still loading session
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  // Fetch user's orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        if (response.status === 401) {
          router.push("/auth/signin")
        } else {
          toast.error('Failed to fetch orders')
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session])

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (response.ok) {
        toast.success('Order cancelled successfully')
        fetchOrders() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tankSize.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Order History</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {session.user?.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-gray-600 mt-2">
              Track and view all your propane delivery orders
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders by ID, tank type, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">All Orders</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading your orders...</span>
            </div>
          )}

          {/* Orders List */}
          {!loading && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {orders.length === 0 ? 'No orders yet' : 'No orders found'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {orders.length === 0 
                        ? "You haven't placed any orders yet. Start by ordering your first propane tank!"
                        : "Try adjusting your search or filter criteria"
                      }
                    </p>
                    {orders.length === 0 && (
                      <Link href="/">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Place Your First Order
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{order.id}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Ordered {new Date(order.createdAt).toLocaleDateString('en-GB')} at{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`
                            inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border
                            ${getStatusColor(order.status)}
                          `}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase().replace('_', ' ')}
                          </div>
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                        {/* Order Details */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            Order Details
                          </h4>
                          <p className="text-sm text-gray-700">{order.quantity}x {order.tankSize}</p>
                          <p className="text-sm font-semibold text-gray-900">{order.totalPrice.toLocaleString()} IQD</p>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            Delivery Address
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{order.deliveryAddress}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.phoneNumber}
                          </p>
                        </div>

                        {/* Driver Info */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            Driver
                          </h4>
                          {order.driver ? (
                            <div>
                              <p className="text-sm text-gray-700">{order.driver.user.name}</p>
                              {order.driver.user.phoneNumber && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {order.driver.user.phoneNumber}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Not assigned yet</p>
                          )}
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            Timeline
                          </h4>
                          <div className="space-y-1">
                            {order.scheduledAt && (
                              <p className="text-xs text-gray-600">
                                Scheduled: {new Date(order.scheduledAt).toLocaleDateString()} at{' '}
                                {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {order.deliveredAt && (
                              <p className="text-xs text-green-600">
                                ✓ Delivered: {new Date(order.deliveredAt).toLocaleDateString()} at{' '}
                                {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {!order.scheduledAt && !order.deliveredAt && (
                              <p className="text-xs text-gray-500">Pending scheduling</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Order Actions */}
                      {order.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </Button>
                          <Link href={`/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      )}

                      {(order.status === 'ASSIGNED' || order.status === 'IN_TRANSIT') && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Link href={`/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              Track Delivery
                            </Button>
                          </Link>
                          {order.driver && (
                            <Button size="sm" variant="outline">
                              Contact Driver
                            </Button>
                          )}
                        </div>
                      )}

                      {order.status === 'DELIVERED' && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Button size="sm" variant="outline">
                            Rate Delivery
                          </Button>
                          <Link href="/">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Reorder
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Need more propane?</h3>
                  <p className="text-gray-600">Place a new order for quick delivery</p>
                </div>
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Place New Order
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}