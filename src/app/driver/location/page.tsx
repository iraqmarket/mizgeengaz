'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MapPin, 
  Navigation, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ToggleLeft,
  ToggleRight,
  Crosshair,
  Map
} from "lucide-react"
import { toast } from "sonner"
import GoogleMap from "@/components/GoogleMap"

interface DriverLocation {
  currentLat?: number
  currentLng?: number
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  lastUpdated?: string
}

interface MapConfig {
  apiKey: string | null
  defaultLat: number
  defaultLng: number
}

export default function DriverLocation() {
  const { data: session } = useSession()
  const [location, setLocation] = useState<DriverLocation>({
    status: 'OFFLINE'
  })
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Fetch current driver location and status
  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        setLoading(true)
        
        // Fetch driver location
        const locationResponse = await fetch('/api/driver/location')
        if (locationResponse.ok) {
          const locationData = await locationResponse.json()
          setLocation(locationData.driver)
        }

        // Fetch map configuration
        const configResponse = await fetch('/api/admin/settings')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData.settings?.googleMapsApiKey) {
            setMapConfig({
              apiKey: configData.settings.googleMapsApiKey,
              defaultLat: configData.settings.mapDefaultLat || 33.3152,
              defaultLng: configData.settings.mapDefaultLng || 44.3661
            })
          }
        }
      } catch (error) {
        console.error('Error fetching driver info:', error)
        toast.error('Failed to fetch driver information')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDriverInfo()
    }
  }, [session])

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch('/api/driver/location', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentLat: latitude,
              currentLng: longitude
            }),
          })

          if (response.ok) {
            setLocation(prev => ({
              ...prev,
              currentLat: latitude,
              currentLng: longitude,
              lastUpdated: new Date().toISOString()
            }))
            toast.success('Location updated successfully!')
          } else {
            toast.error('Failed to update location')
          }
        } catch (error) {
          console.error('Error updating location:', error)
          toast.error('Failed to update location')
        }
        
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Failed to get your location')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleStatusToggle = async () => {
    const newStatus = location.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE'
    
    try {
      setUpdating(true)
      const response = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setLocation(prev => ({ ...prev, status: newStatus }))
        toast.success(`Status updated to ${newStatus.toLowerCase()}`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-600">Loading location info...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Location & Status</h1>
        <p className="text-gray-600 mt-2">
          Manage your availability and location for order assignments
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" />
            Driver Status
          </CardTitle>
          <CardDescription>
            Control your availability for receiving new orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${location.status === 'AVAILABLE' ? 'bg-green-100' : 
                  location.status === 'BUSY' ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                {location.status === 'AVAILABLE' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : location.status === 'BUSY' ? (
                  <Clock className="h-6 w-6 text-blue-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {location.status.charAt(0) + location.status.slice(1).toLowerCase()}
                </p>
                <p className="text-sm text-gray-600">
                  {location.status === 'AVAILABLE' 
                    ? 'Ready to receive new orders'
                    : location.status === 'BUSY'
                    ? 'Currently on a delivery'
                    : 'Not receiving new orders'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={handleStatusToggle}
              disabled={updating || location.status === 'BUSY'}
              className={`flex items-center gap-2 ${
                location.status === 'AVAILABLE' 
                  ? 'bg-gray-600 hover:bg-gray-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : location.status === 'AVAILABLE' ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {updating 
                ? 'Updating...' 
                : location.status === 'AVAILABLE' 
                ? 'Go Offline' 
                : 'Go Online'
              }
            </Button>
          </div>

          {location.status === 'BUSY' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                You are currently busy with a delivery. Complete your current delivery to change status.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Current Location
          </CardTitle>
          <CardDescription>
            Update your location for accurate order assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input
                value={location.currentLat?.toString() || ''}
                readOnly
                placeholder="Not available"
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                value={location.currentLng?.toString() || ''}
                readOnly
                placeholder="Not available"
                className="bg-gray-50"
              />
            </div>
          </div>

          {location.lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(location.lastUpdated).toLocaleDateString()} at{' '}
              {new Date(location.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          <Button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {gettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Getting Location...
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 mr-2" />
                Update Current Location
              </>
            )}
          </Button>

          {!location.currentLat && !location.currentLng && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location not set. Update your location to receive nearby order assignments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Map */}
      {mapConfig?.apiKey && location.currentLat && location.currentLng && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-600" />
              Current Location
            </CardTitle>
            <CardDescription>
              Your position on the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleMap
              apiKey={mapConfig.apiKey}
              center={{ lat: location.currentLat, lng: location.currentLng }}
              zoom={15}
              markers={[{
                id: 'current-location',
                position: { lat: location.currentLat, lng: location.currentLng },
                title: 'Your Current Location',
                info: `Status: ${location.status}`,
                type: 'driver'
              }]}
              height="300px"
            />
          </CardContent>
        </Card>
      )}

      {/* Location Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" />
            Location Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Keep your location updated for better order matching in your area
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Go online during peak hours (11 AM - 2 PM, 6 PM - 9 PM) for more orders
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Update your location before starting each delivery for accurate tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}