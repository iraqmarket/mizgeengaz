'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  Users, 
  Car, 
  DollarSign, 
  Package, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Home
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: Home
  },
  {
    href: "/admin/drivers",
    label: "Drivers",
    icon: Car
  },
  {
    href: "/admin/prices",
    label: "Pricing",
    icon: DollarSign
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: Package
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">PropaneGo</span>
              <p className="text-xs text-blue-100">Admin Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Manage your PropaneGo business</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Online</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">A</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}