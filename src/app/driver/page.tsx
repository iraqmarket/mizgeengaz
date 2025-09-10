'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone,
  Loader2,
  User,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface DriverStats {
  totalDeliveries: number
  todayDeliveries: number
  pendingOrders: number
  earnings: number
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
}

interface RecentOrder {
  id: string
  customerName: string
  tankSize: string
  quantity: number
  totalPrice: number
  deliveryAddress: string
  phoneNumber: string
  status: string
  scheduledAt?: string
  createdAt: string
}

export default function DriverDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    todayDeliveries: 0,
    pendingOrders: 0,
    earnings: 0,
    status: 'OFFLINE'
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Fetch driver dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.email) return

      try {
        setLoading(true)
        
        // Fetch driver stats and orders
        const [statsResponse, ordersResponse] = await Promise.all([
          fetch('/api/driver/stats'),
          fetch('/api/driver/orders')
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.stats)
        }

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setRecentOrders(ordersData.orders.slice(0, 5)) // Show only 5 most recent
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session])

  const handleStatusToggle = async () => {
    const newStatus = stats.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE'
    
    try {
      setUpdatingStatus(true)
      const response = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStats(prev => ({ ...prev, status: newStatus }))
        toast.success(`Status updated to ${newStatus.toLowerCase()}`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'BUSY':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800'
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'Driver'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your deliveries and track your performance
        </p>
      </div>

      {/* Status Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
                ${getStatusColor(stats.status)}
              `}>
                <div className={`w-2 h-2 rounded-full ${
                  stats.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-gray-400'
                } ${stats.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                {stats.status.charAt(0) + stats.status.slice(1).toLowerCase()}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {stats.status === 'AVAILABLE' 
                    ? 'You are available for new deliveries'
                    : stats.status === 'BUSY'
                    ? 'You are currently on a delivery'
                    : 'You are offline and not receiving orders'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={handleStatusToggle}
              disabled={updatingStatus || stats.status === 'BUSY'}
              className={`${
                stats.status === 'AVAILABLE' 
                  ? 'bg-gray-600 hover:bg-gray-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {updatingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {updatingStatus 
                ? 'Updating...' 
                : stats.status === 'AVAILABLE' 
                ? 'Go Offline' 
                : 'Go Online'
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Driver Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">All time deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayDeliveries}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Awaiting pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.earnings.toLocaleString()} IQD
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Daily earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Active Deliveries
            </CardTitle>
            <CardDescription>
              Orders currently assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.filter(o => ['ASSIGNED', 'IN_TRANSIT'].includes(o.status)).length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No active deliveries</p>
                <p className="text-sm text-gray-400">
                  {stats.status === 'AVAILABLE' 
                    ? 'Wait for new orders to be assigned'
                    : 'Go online to receive delivery assignments'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders
                  .filter(o => ['ASSIGNED', 'IN_TRANSIT'].includes(o.status))
                  .slice(0, 2)
                  .map((order) => (
                    <div key={order.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{order.id}</span>
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${getOrderStatusColor(order.status)}
                        `}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {order.quantity}x {order.tankSize} - {order.totalPrice.toLocaleString()} IQD
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2">{order.deliveryAddress}</p>
                      <div className="flex items-center gap-2">
                        <Link href={`/driver/orders/${order.id}`}>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            View Details
                          </Button>
                        </Link>
                        {order.status === 'ASSIGNED' && (
                          <Button size="sm" variant="outline">
                            Start Delivery
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                <Link href="/driver/orders">
                  <Button variant="outline" className="w-full">
                    View All Deliveries
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              Your deliveries for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.filter(o => {
              const orderDate = new Date(o.scheduledAt || o.createdAt).toDateString()
              const today = new Date().toDateString()
              return orderDate === today
            }).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No deliveries scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders
                  .filter(o => {
                    const orderDate = new Date(o.scheduledAt || o.createdAt).toDateString()
                    const today = new Date().toDateString()
                    return orderDate === today
                  })
                  .map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.id}</p>
                        <p className="text-xs text-gray-600">{order.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {order.scheduledAt 
                            ? new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Time TBD'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.quantity}x {order.tankSize}</p>
                        <p className="text-xs text-gray-500">{order.totalPrice.toLocaleString()} IQD</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest delivery activities
              </CardDescription>
            </div>
            <Link href="/driver/orders">
              <Button variant="outline" size="sm">
                View All Orders
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No recent activity</p>
              <p className="text-sm text-gray-400">Your delivery history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {order.customerName} - {order.quantity}x {order.tankSize}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-medium">{order.totalPrice.toLocaleString()} IQD</p>
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${getOrderStatusColor(order.status)}
                      `}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link href={`/driver/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deliveries Completed</span>
                <span className="font-medium">{stats.totalDeliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Rating</span>
                <span className="font-medium">4.8 ⭐</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On-Time Delivery Rate</span>
                <span className="font-medium text-green-600">96%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/driver/orders">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View My Deliveries
                </Button>
              </Link>
              <Link href="/driver/location">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Update Location
                </Button>
              </Link>
              <Link href="/driver/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}