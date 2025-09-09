'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  Clock, 
  User, 
  ShoppingCart,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Plus
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Order {
  id: string
  tankSize: string
  quantity: number
  totalPrice: number
  status: string
  createdAt: string
}

interface UserProfile {
  id: string
  name?: string
  email: string
  phoneNumber?: string
  address?: string
  addressType?: string
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user data and recent orders
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return

      try {
        setLoading(true)
        
        // Fetch user profile
        const profileResponse = await fetch('/api/user/profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData.user)
        }

        // Fetch recent orders
        const ordersResponse = await fetch('/api/orders')
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setRecentOrders(ordersData.orders.slice(0, 3)) // Show only 3 most recent
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [session])

  const orderStats = {
    total: recentOrders.length,
    pending: recentOrders.filter(o => o.status === 'PENDING').length,
    delivered: recentOrders.filter(o => o.status === 'DELIVERED').length,
    totalSpent: recentOrders.reduce((sum, order) => sum + order.totalPrice, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800'
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'Customer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your propane orders and account settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orderStats.totalSpent.toLocaleString()} IQD
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Lifetime spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Place New Order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Place New Order
            </CardTitle>
            <CardDescription>
              Order your propane tank with fast delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Get your propane delivered to your door in under 2 hours
              </p>
              <Link href="/user/order">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Summary
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{userProfile?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{userProfile?.phoneNumber || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 line-clamp-1">{userProfile?.address || 'No address saved'}</span>
              </div>
              <Link href="/user/profile">
                <Button variant="outline" className="w-full mt-4">
                  Update Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Your latest propane deliveries
              </CardDescription>
            </div>
            <Link href="/user/orders">
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
              <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
              <Link href="/user/order">
                <Button className="bg-green-600 hover:bg-green-700">
                  Place Your First Order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {order.quantity}x {order.tankSize} - {order.totalPrice.toLocaleString()} IQD
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${getStatusColor(order.status)}
                    `}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase().replace('_', ' ')}
                    </span>
                    <Link href={`/user/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link href="/user/orders">
                  <Button variant="outline">
                    View All {recentOrders.length > 3 ? `${recentOrders.length} ` : ''}Orders
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}