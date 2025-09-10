'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Search, Filter, Eye, MapPin, Clock, User, Phone, Loader2, RefreshCw, Truck, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface Order {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    phoneNumber?: string
  }
  driverId?: string
  driver?: {
    id: string
    user: {
      name: string
      phoneNumber?: string
    }
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800'
    case 'IN_TRANSIT':
      return 'bg-orange-100 text-orange-800'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'CONFIRMED':
      return <CheckCircle className="h-4 w-4" />
    case 'ASSIGNED':
      return <User className="h-4 w-4" />
    case 'IN_TRANSIT':
      return <Truck className="h-4 w-4" />
    case 'DELIVERED':
      return <Package className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders')
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Refresh orders
  const refreshOrders = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/orders')
      
      if (!response.ok) {
        throw new Error('Failed to refresh orders')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
      toast.success('Orders refreshed')
    } catch (error) {
      console.error('Error refreshing orders:', error)
      toast.error('Failed to refresh orders')
    } finally {
      setRefreshing(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      toast.success(`Order ${newStatus.toLowerCase()}`)
      await refreshOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    }
  }

  // Load orders on mount
  useEffect(() => {
    fetchOrders()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.includes(searchTerm) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    ASSIGNED: orders.filter(o => o.status === 'ASSIGNED').length,
    IN_TRANSIT: orders.filter(o => o.status === 'IN_TRANSIT').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all customer orders
          </p>
        </div>
        <Button 
          onClick={refreshOrders} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card 
            key={status} 
            className={`cursor-pointer transition-colors ${
              statusFilter === status ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {status !== 'ALL' && getStatusIcon(status)}
              </div>
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
                  placeholder="Search orders by ID, customer, phone, or address..."
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`
                    inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                    ${getStatusColor(order.status)}
                  `}>
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase().replace('_', ' ')}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Customer
                  </h4>
                  <p className="text-sm font-medium text-gray-800">{order.user.name}</p>
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
                  <p className="text-sm font-semibold text-blue-600">{order.totalPrice.toLocaleString()} IQD</p>
                </div>

                {/* Driver Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    Driver
                  </h4>
                  {order.driver ? (
                    <>
                      <p className="text-sm text-gray-700">{order.driver.user.name}</p>
                      {order.driver.user.phoneNumber && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {order.driver.user.phoneNumber}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not assigned</p>
                  )}
                </div>

                {/* Delivery Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Delivery
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{order.deliveryAddress}</p>
                  {order.scheduledAt && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Delivered at {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {order.status === 'PENDING' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                  >
                    Confirm Order
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateOrderStatus(order.id, 'ASSIGNED')}
                  >
                    Assign Driver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}

              {order.status === 'CONFIRMED' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => updateOrderStatus(order.id, 'ASSIGNED')}
                  >
                    Assign Driver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                  >
                    Mark In Transit
                  </Button>
                </div>
              )}

              {order.status === 'ASSIGNED' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                  >
                    Mark In Transit
                  </Button>
                </div>
              )}

              {order.status === 'IN_TRANSIT' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                  >
                    Mark as Delivered
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL" 
                ? "Try adjusting your search or filter criteria"
                : "Orders will appear here as customers place them"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}