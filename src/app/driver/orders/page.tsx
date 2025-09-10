'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Navigation,
  Play,
  Square
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface DriverOrder {
  id: string
  user: {
    name?: string
    email: string
    phoneNumber?: string
  }
  tankSize: string
  quantity: number
  totalPrice: number
  deliveryAddress: string
  phoneNumber: string
  status: 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  scheduledAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'IN_TRANSIT':
      return 'bg-blue-100 text-blue-800 border-blue-200'
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
    case 'ASSIGNED':
      return <Clock className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function DriverOrders() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<DriverOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Fetch driver's orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/driver/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        toast.error('Failed to fetch orders')
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

  const handleStartDelivery = async (orderId: string) => {
    try {
      const response = await fetch(`/api/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start_delivery' }),
      })

      if (response.ok) {
        toast.success('Delivery started!')
        fetchOrders() // Refresh
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start delivery')
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      toast.error('Failed to start delivery')
    }
  }

  const handleCompleteDelivery = async (orderId: string) => {
    if (!confirm('Mark this delivery as completed?')) return

    try {
      const response = await fetch(`/api/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'complete_delivery' }),
      })

      if (response.ok) {
        toast.success('Delivery completed!')
        fetchOrders() // Refresh
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to complete delivery')
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      toast.error('Failed to complete delivery')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    ALL: orders.length,
    ASSIGNED: orders.filter(o => o.status === 'ASSIGNED').length,
    IN_TRANSIT: orders.filter(o => o.status === 'IN_TRANSIT').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
        <p className="text-gray-600 mt-2">
          Manage your assigned orders and deliveries
        </p>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card 
            key={status} 
            className={`cursor-pointer transition-colors ${
              statusFilter === status ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600 capitalize">
                {status.toLowerCase().replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by ID, customer name, or address..."
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="ALL">All Orders</option>
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
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-3 text-gray-600">Loading your deliveries...</span>
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
                  {orders.length === 0 ? 'No deliveries assigned' : 'No orders found'}
                </h3>
                <p className="text-gray-500">
                  {orders.length === 0 
                    ? "Wait for orders to be assigned to you by the admin"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          Assigned {new Date(order.createdAt).toLocaleDateString('en-GB')} at{' '}
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
                      <Link href={`/driver/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        Customer
                      </h4>
                      <p className="text-sm font-medium text-gray-800">{order.user.name || 'Customer'}</p>
                      <p className="text-xs text-gray-500">{order.user.email}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {order.phoneNumber}
                      </p>
                    </div>

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
                      {order.scheduledAt && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.scheduledAt).toLocaleDateString()} at{' '}
                          {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    {order.status === 'ASSIGNED' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleStartDelivery(order.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Delivery
                        </Button>
                        <Button size="sm" variant="outline">
                          <Navigation className="h-4 w-4 mr-1" />
                          Get Directions
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Call Customer
                        </Button>
                      </>
                    )}

                    {order.status === 'IN_TRANSIT' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleCompleteDelivery(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Delivered
                        </Button>
                        <Button size="sm" variant="outline">
                          <Navigation className="h-4 w-4 mr-1" />
                          Update Location
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Call Customer
                        </Button>
                      </>
                    )}

                    {order.status === 'DELIVERED' && (
                      <>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Completed on {new Date(order.deliveredAt!).toLocaleDateString()}
                        </span>
                      </>
                    )}

                    <Link href={`/driver/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL" 
                ? "Try adjusting your search or filter criteria"
                : "Wait for orders to be assigned to you"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}