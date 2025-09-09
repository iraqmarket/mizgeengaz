'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface Driver {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    phoneNumber?: string
  }
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'SUSPENDED'
  currentLat?: number
  currentLng?: number
  orders: { id: string; status: string }[]
  createdAt: string
  updatedAt: string
}


const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800'
    case 'BUSY':
      return 'bg-blue-100 text-blue-800'
    case 'OFFLINE':
      return 'bg-gray-100 text-gray-800'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return <CheckCircle className="h-4 w-4" />
    case 'BUSY':
      return <Clock className="h-4 w-4" />
    case 'OFFLINE':
      return <Pause className="h-4 w-4" />
    case 'SUSPENDED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: ''
  })

  // Fetch drivers from API
  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/drivers')
      if (response.ok) {
        const data = await response.json()
        setDrivers(data.drivers)
      } else {
        toast.error('Failed to fetch drivers')
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Failed to fetch drivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!driverFormData.name || !driverFormData.email || !driverFormData.password || 
        !driverFormData.licenseNumber || !driverFormData.vehicleType || !driverFormData.vehiclePlate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (driverFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverFormData),
      })

      if (response.ok) {
        toast.success('Driver registered successfully!')
        setDriverFormData({
          name: '',
          email: '',
          password: '',
          phoneNumber: '',
          licenseNumber: '',
          vehicleType: '',
          vehiclePlate: ''
        })
        setShowAddDriver(false)
        fetchDrivers() // Refresh the list
      } else {
        const error = await response.json()
        const errorMessage = error.error || 'Failed to register driver'
        
        // Show specific guidance for duplicate entries
        if (errorMessage.includes('email address already exists')) {
          toast.error(`${errorMessage}. Please use a different email address or check if this person is already registered.`)
        } else if (errorMessage.includes('license number already exists')) {
          toast.error(`${errorMessage}. Please verify the license number or check if this driver is already registered.`)
        } else if (errorMessage.includes('plate number already exists')) {
          toast.error(`${errorMessage}. Please verify the vehicle plate or check if this vehicle is already registered.`)
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error adding driver:', error)
      toast.error('Failed to register driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || driver.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const AddDriverForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Driver</CardTitle>
        <CardDescription>Register a new driver to your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddDriver} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                placeholder="Enter driver's full name"
                value={driverFormData.name}
                onChange={(e) => setDriverFormData({...driverFormData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter email address"
                value={driverFormData.email}
                onChange={(e) => setDriverFormData({...driverFormData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter password for driver account"
                value={driverFormData.password}
                onChange={(e) => setDriverFormData({...driverFormData, password: e.target.value})}
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="Enter phone number"
                value={driverFormData.phoneNumber}
                onChange={(e) => setDriverFormData({...driverFormData, phoneNumber: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license">License Number *</Label>
              <Input 
                id="license" 
                placeholder="Enter driver's license number"
                value={driverFormData.licenseNumber}
                onChange={(e) => setDriverFormData({...driverFormData, licenseNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="vehiclePlate">Vehicle Plate *</Label>
              <Input 
                id="vehiclePlate" 
                placeholder="Enter vehicle plate number"
                value={driverFormData.vehiclePlate}
                onChange={(e) => setDriverFormData({...driverFormData, vehiclePlate: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vehicleType">Vehicle Type *</Label>
            <select 
              id="vehicleType"
              value={driverFormData.vehicleType}
              onChange={(e) => setDriverFormData({...driverFormData, vehicleType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">Select vehicle type</option>
              <option value="شاحنة صغيرة (Pickup Truck)">شاحنة صغيرة (Pickup Truck)</option>
              <option value="فان (Van)">فان (Van)</option>
              <option value="شاحنة متوسطة (Medium Truck)">شاحنة متوسطة (Medium Truck)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding Driver...
                </>
              ) : (
                'Add Driver'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowAddDriver(false)
                setDriverFormData({
                  name: '',
                  email: '',
                  password: '',
                  phoneNumber: '',
                  licenseNumber: '',
                  vehicleType: '',
                  vehiclePlate: ''
                })
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-2">
            Manage your delivery drivers and their information
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDriver(!showAddDriver)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {showAddDriver && <AddDriverForm />}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search drivers by name, email, or plate..."
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
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="OFFLINE">Offline</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading drivers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{driver.user.name}</h3>
                    <p className="text-sm text-gray-500">Driver ID: {driver.id}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{driver.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{driver.user.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {driver.currentLat && driver.currentLng 
                      ? `${driver.currentLat.toFixed(4)}, ${driver.currentLng.toFixed(4)}`
                      : 'Location not available'
                    }
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Vehicle</p>
                    <p className="font-medium">{driver.vehicleType}</p>
                    <p className="text-xs text-gray-400">{driver.vehiclePlate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Orders</p>
                    <p className="font-medium">{driver.orders.length}</p>
                    <p className="text-xs text-gray-400">License: {driver.licenseNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(driver.status)}
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getStatusColor(driver.status)}
                  `}>
                    {driver.status.charAt(0) + driver.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!loading && filteredDrivers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "ALL" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first driver"
              }
            </p>
            {!searchTerm && statusFilter === "ALL" && (
              <Button 
                onClick={() => setShowAddDriver(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Your First Driver
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}