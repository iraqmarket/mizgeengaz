'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Mail, 
  Phone, 
  Truck, 
  Save, 
  Loader2,
  CheckCircle,
  IdCard,
  Car
} from "lucide-react"
import { toast } from "sonner"

interface DriverProfile {
  user: {
    id: string
    name?: string
    email: string
    phoneNumber?: string
  }
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  createdAt: string
}

export default function DriverProfile() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: ''
  })

  // Fetch driver profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/driver/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data.driver)
          setFormData({
            name: data.driver.user.name || '',
            phoneNumber: data.driver.user.phoneNumber || '',
            licenseNumber: data.driver.licenseNumber,
            vehicleType: data.driver.vehicleType,
            vehiclePlate: data.driver.vehiclePlate
          })
        } else {
          toast.error('Failed to load profile')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchProfile()
    }
  }, [session])

  const handleSave = async () => {
    if (!formData.name || !formData.licenseNumber || !formData.vehicleType || !formData.vehiclePlate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        // Refresh profile data
        const data = await response.json()
        setProfile(data.driver)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-500">Unable to load your driver profile</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal and vehicle information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile.user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+964 (770) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="license">License Number *</Label>
                <Input
                  id="license"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  placeholder="Enter your license number"
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Select vehicle type</option>
                  <option value="شاحنة صغيرة (Pickup Truck)">شاحنة صغيرة (Pickup Truck)</option>
                  <option value="فان (Van)">فان (Van)</option>
                  <option value="شاحنة متوسطة (Medium Truck)">شاحنة متوسطة (Medium Truck)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="vehiclePlate">Vehicle Plate *</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                  placeholder="Enter vehicle plate number"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Name:</span>
                  <span className={formData.name ? 'text-green-600' : 'text-red-500'}>
                    {formData.name ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className={formData.phoneNumber ? 'text-green-600' : 'text-orange-500'}>
                    {formData.phoneNumber ? '✓' : '⚠'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">License:</span>
                  <span className={formData.licenseNumber ? 'text-green-600' : 'text-red-500'}>
                    {formData.licenseNumber ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className={formData.vehicleType && formData.vehiclePlate ? 'text-green-600' : 'text-red-500'}>
                    {formData.vehicleType && formData.vehiclePlate ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <IdCard className="h-4 w-4" />
                    <span className="font-medium">Driver Since:</span>
                  </div>
                  <p className="text-sm text-blue-700 ml-6">
                    {new Date(profile.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}