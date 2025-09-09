'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Search, Filter, Eye, MapPin, Clock, User, Phone } from "lucide-react"

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  driverName?: string
  tankSize: string
  quantity: number
  totalPrice: number
  deliveryAddress: string
  status: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  scheduledAt?: string
  deliveredAt?: string
  createdAt: string
}

// Orders will be fetched from API

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

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [orders] = useState<Order[]>([]) // Will be populated with real API data later

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">
          Manage and track all customer orders
        </p>
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
                  placeholder="Search orders by ID, customer name, or email..."
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
                    <h3 className="font-semibold text-gray-900">{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${getStatusColor(order.status)}
                  `}>
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
                  <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {order.customerPhone}
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

                {/* Driver Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Driver</h4>
                  {order.driverName ? (
                    <p className="text-sm text-gray-700">{order.driverName}</p>
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

              {order.status === 'PENDING' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Confirm Order
                  </Button>
                  <Button size="sm" variant="outline">
                    Assign Driver
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    Cancel Order
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