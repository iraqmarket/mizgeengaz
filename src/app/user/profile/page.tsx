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
  MapPin, 
  Save, 
  Loader2,
  CheckCircle,
  Navigation,
  Home
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name?: string
  email: string
  phoneNumber?: string
  addressType?: 'HOME' | 'BUSINESS' | 'APARTMENT'
  address?: string
  mapPinLat?: number
  mapPinLng?: number
  complexName?: string
  buildingNumber?: string
  floorNumber?: string
  apartmentNumber?: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setProfile(data.user)
          }
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

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setIsLoadingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.display_name || `${latitude}, ${longitude}`
            setProfile(prev => prev ? {
              ...prev,
              address,
              mapPinLat: latitude,
              mapPinLng: longitude
            } : null)
            toast.success('Location updated successfully!')
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error)
          setProfile(prev => prev ? {
            ...prev,
            address: `${latitude}, ${longitude}`,
            mapPinLat: latitude,
            mapPinLng: longitude
          } : null)
        }
        
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Failed to get your location')
        setIsLoadingLocation(false)
      }
    )
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
          <p className="text-gray-500">Unable to load your profile information</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and delivery preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phoneNumber || ''}
                  onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
                  placeholder="+964 (770) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="addressType">Address Type</Label>
                <select
                  id="addressType"
                  value={profile.addressType || 'HOME'}
                  onChange={(e) => setProfile({...profile, addressType: e.target.value as 'HOME' | 'BUSINESS' | 'APARTMENT'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="HOME">🏠 Home</option>
                  <option value="BUSINESS">🏢 Business</option>
                  <option value="APARTMENT">🏬 Apartment</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-2 text-sm"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
                  </Button>
                </div>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  placeholder="Enter your street address"
                />
              </div>

              {profile.addressType === 'APARTMENT' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    Apartment Details
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="complexName">Complex Name</Label>
                      <Input
                        id="complexName"
                        value={profile.complexName || ''}
                        onChange={(e) => setProfile({...profile, complexName: e.target.value})}
                        placeholder="Complex or building name"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buildingNumber">Building Number</Label>
                      <Input
                        id="buildingNumber"
                        value={profile.buildingNumber || ''}
                        onChange={(e) => setProfile({...profile, buildingNumber: e.target.value})}
                        placeholder="Building number"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="floorNumber">Floor Number</Label>
                      <Input
                        id="floorNumber"
                        value={profile.floorNumber || ''}
                        onChange={(e) => setProfile({...profile, floorNumber: e.target.value})}
                        placeholder="Floor #"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartmentNumber">Apartment Number</Label>
                      <Input
                        id="apartmentNumber"
                        value={profile.apartmentNumber || ''}
                        onChange={(e) => setProfile({...profile, apartmentNumber: e.target.value})}
                        placeholder="Apt/Unit #"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                  <span className={profile.name ? 'text-green-600' : 'text-red-500'}>
                    {profile.name ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className={profile.phoneNumber ? 'text-green-600' : 'text-red-500'}>
                    {profile.phoneNumber ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Address:</span>
                  <span className={profile.address ? 'text-green-600' : 'text-red-500'}>
                    {profile.address ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-gray-600 mb-3">
                  Complete your profile for faster ordering
                </p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
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