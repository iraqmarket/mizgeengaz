'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, Package, DollarSign, TrendingUp, Clock } from "lucide-react"

const stats = [
  {
    title: "Total Users",
    value: "1,234",
    description: "+20.1% from last month",
    icon: Users,
    color: "text-blue-600"
  },
  {
    title: "Active Drivers",
    value: "56",
    description: "8 online now",
    icon: Car,
    color: "text-green-600"
  },
  {
    title: "Orders Today",
    value: "128",
    description: "+12% from yesterday",
    icon: Package,
    color: "text-orange-600"
  },
  {
    title: "Revenue",
    value: "15,570,000 IQD",
    description: "+8.2% from last week",
    icon: DollarSign,
    color: "text-purple-600"
  }
]

// Recent orders will be fetched from API

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your PropaneGo business
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Monthly revenue for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart will be implemented here</p>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Order Statistics
            </CardTitle>
            <CardDescription>
              Order status distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Orders
          </CardTitle>
          <CardDescription>
            Latest orders from your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Driver</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-8 text-center text-gray-500" colSpan={6}>
                    No recent orders available. Orders will appear here once customers place them.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}