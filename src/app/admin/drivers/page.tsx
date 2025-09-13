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
  Loader2,
  X,
  Upload,
  User
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
  profileImage?: string
  assignedZoneId?: string
  assignedZone?: {
    id: string
    name: string
    color: string
    description?: string
  }
  orders: { id: string; status: string }[]
  createdAt: string
  updatedAt: string
}

interface DeliveryZone {
  id: string
  name: string
  color: string
  description?: string
  isActive: boolean
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
  const [showEditDriver, setShowEditDriver] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: '',
    profileImage: '',
    assignedZoneId: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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

  // Fetch zones from API
  const fetchZones = async () => {
    try {
      setZonesLoading(true)
      const response = await fetch('/api/admin/zones')
      if (response.ok) {
        const data = await response.json()
        setZones(data.zones.filter((zone: DeliveryZone) => zone.isActive))
      } else {
        toast.error('Failed to fetch zones')
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
      toast.error('Failed to fetch zones')
    } finally {
      setZonesLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
    fetchZones()
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
      
      // Upload image first if selected
      let imageUrl = ''
      if (selectedImage) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...driverFormData,
          profileImage: imageUrl
        }),
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
          vehiclePlate: '',
          profileImage: '',
          assignedZoneId: ''
        })
        setSelectedImage(null)
        setImagePreview(null)
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed')
        return
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum 5MB allowed')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null

    const formData = new FormData()
    formData.append('file', selectedImage)

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload image')
        return null
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    }
  }

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setDriverFormData({
      name: driver.user.name || '',
      email: driver.user.email || '',
      password: '', // Don't pre-fill password for security
      phoneNumber: driver.user.phoneNumber || '',
      licenseNumber: driver.licenseNumber || '',
      vehicleType: driver.vehicleType || '',
      vehiclePlate: driver.vehiclePlate || '',
      profileImage: driver.profileImage || '',
      assignedZoneId: driver.assignedZoneId || ''
    })
    
    // Set current image preview if exists
    if (driver.profileImage) {
      setImagePreview(driver.profileImage)
    } else {
      setImagePreview(null)
    }
    setSelectedImage(null)
    setShowEditDriver(true)
  }

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDriver) return

    // Validate required fields
    if (!driverFormData.name || !driverFormData.email || 
        !driverFormData.licenseNumber || !driverFormData.vehicleType || !driverFormData.vehiclePlate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Upload new image if selected
      let imageUrl = driverFormData.profileImage
      if (selectedImage) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }
      
      const updateData = {
        name: driverFormData.name,
        email: driverFormData.email,
        phoneNumber: driverFormData.phoneNumber,
        licenseNumber: driverFormData.licenseNumber,
        vehicleType: driverFormData.vehicleType,
        vehiclePlate: driverFormData.vehiclePlate,
        profileImage: imageUrl,
        assignedZoneId: driverFormData.assignedZoneId || null,
      }

      const response = await fetch(`/api/admin/drivers/${selectedDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success('Driver updated successfully!')
        setShowEditDriver(false)
        setSelectedDriver(null)
        setDriverFormData({
          name: '',
          email: '',
          password: '',
          phoneNumber: '',
          licenseNumber: '',
          vehicleType: '',
          vehiclePlate: '',
          profileImage: '',
          assignedZoneId: ''
        })
        setSelectedImage(null)
        setImagePreview(null)
        fetchDrivers() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update driver')
      }
    } catch (error) {
      console.error('Error updating driver:', error)
      toast.error('Failed to update driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteDriver = async () => {
    if (!selectedDriver) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/drivers/${selectedDriver.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Driver deleted successfully!')
        setShowDeleteConfirm(false)
        setSelectedDriver(null)
        fetchDrivers() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete driver')
      }
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast.error('Failed to delete driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (driverId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Driver status updated successfully!')
        fetchDrivers() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update driver status')
      }
    } catch (error) {
      console.error('Error updating driver status:', error)
      toast.error('Failed to update driver status')
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

          <div>
            <Label htmlFor="assignedZone">Assigned Zone</Label>
            <select 
              id="assignedZone"
              value={driverFormData.assignedZoneId}
              onChange={(e) => setDriverFormData({...driverFormData, assignedZoneId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">No zone assigned</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} {zone.description && `- ${zone.description}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Optional. Drivers will only receive orders from their assigned zone.</p>
          </div>

          <div>
            <Label htmlFor="profileImage">Profile Image</Label>
            <div className="space-y-2">
              <Input
                id="profileImage"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">Optional. JPEG, PNG, or WebP. Max 5MB.</p>
              
              {imagePreview && (
                <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
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
                  vehiclePlate: '',
                  profileImage: ''
                })
                setSelectedImage(null)
                setImagePreview(null)
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

  const EditDriverModal = () => {
    if (!showEditDriver || !selectedDriver) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Edit Driver</CardTitle>
              <CardDescription>Update driver information</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEditDriver(false)
                setSelectedDriver(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateDriver} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input 
                    id="edit-name" 
                    placeholder="Enter driver's full name"
                    value={driverFormData.name}
                    onChange={(e) => setDriverFormData({...driverFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    placeholder="Enter email address"
                    value={driverFormData.email}
                    onChange={(e) => setDriverFormData({...driverFormData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input 
                  id="edit-phone" 
                  placeholder="Enter phone number"
                  value={driverFormData.phoneNumber}
                  onChange={(e) => setDriverFormData({...driverFormData, phoneNumber: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-license">License Number *</Label>
                  <Input 
                    id="edit-license" 
                    placeholder="Enter driver's license number"
                    value={driverFormData.licenseNumber}
                    onChange={(e) => setDriverFormData({...driverFormData, licenseNumber: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-vehiclePlate">Vehicle Plate *</Label>
                  <Input 
                    id="edit-vehiclePlate" 
                    placeholder="Enter vehicle plate number"
                    value={driverFormData.vehiclePlate}
                    onChange={(e) => setDriverFormData({...driverFormData, vehiclePlate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-vehicleType">Vehicle Type *</Label>
                <select 
                  id="edit-vehicleType"
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

              <div>
                <Label htmlFor="edit-assignedZone">Assigned Zone</Label>
                <select 
                  id="edit-assignedZone"
                  value={driverFormData.assignedZoneId}
                  onChange={(e) => setDriverFormData({...driverFormData, assignedZoneId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">No zone assigned</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} {zone.description && `- ${zone.description}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Optional. Drivers will only receive orders from their assigned zone.</p>
              </div>

              <div>
                <Label htmlFor="edit-profileImage">Profile Image</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-profileImage"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">Optional. JPEG, PNG, or WebP. Max 5MB.</p>
                  
                  {imagePreview && (
                    <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
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
                      Updating Driver...
                    </>
                  ) : (
                    'Update Driver'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDriver(false)
                    setSelectedDriver(null)
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm || !selectedDriver) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Delete Driver</CardTitle>
            <CardDescription>
              Are you sure you want to delete this driver? This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Car className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold">{selectedDriver.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedDriver.user.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Vehicle: {selectedDriver.vehicleType}</p>
                <p>Plate: {selectedDriver.vehiclePlate}</p>
                <p>License: {selectedDriver.licenseNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={confirmDeleteDriver}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Driver'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedDriver(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      
      {/* Modals */}
      <EditDriverModal />
      <DeleteConfirmModal />

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
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {driver.profileImage ? (
                      <img
                        src={driver.profileImage}
                        alt={driver.user.name || 'Driver'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
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
                
                {driver.assignedZone && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">Assigned Zone</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: driver.assignedZone.color }}
                          ></div>
                          <span className="font-medium text-sm">{driver.assignedZone.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(driver.status)}
                    <select
                      value={driver.status}
                      onChange={(e) => handleStatusUpdate(driver.id, e.target.value)}
                      className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer
                        ${getStatusColor(driver.status)}
                      `}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="BUSY">Busy</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditDriver(driver)}
                      title="Edit driver"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDriver(driver)}
                      title="Delete driver"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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