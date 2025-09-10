'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Map,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import GoogleMap from "@/components/GoogleMap"

interface DeliveryZone {
  id: string
  name: string
  color: string
  coordinates: Array<{lat: number, lng: number}>
  isActive: boolean
  deliveryFee?: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Dahuk city zones with approximate boundaries
const dahukZones = [
  {
    name: "Central Dahuk",
    color: "#3B82F6", // Blue
    description: "City center and main commercial area",
    deliveryFee: 15000,
    coordinates: [
      {lat: 36.8672, lng: 42.9976},
      {lat: 36.8672, lng: 43.0176}, 
      {lat: 36.8472, lng: 43.0176},
      {lat: 36.8472, lng: 42.9976}
    ]
  },
  {
    name: "Northern Districts", 
    color: "#10B981", // Green
    description: "Residential areas north of center",
    deliveryFee: 18000,
    coordinates: [
      {lat: 36.8772, lng: 42.9976},
      {lat: 36.8772, lng: 43.0176},
      {lat: 36.8672, lng: 43.0176},
      {lat: 36.8672, lng: 42.9976}
    ]
  },
  {
    name: "Southern Districts",
    color: "#F59E0B", // Orange
    description: "Southern residential and industrial areas", 
    deliveryFee: 18000,
    coordinates: [
      {lat: 36.8472, lng: 42.9976},
      {lat: 36.8472, lng: 43.0176},
      {lat: 36.8272, lng: 43.0176},
      {lat: 36.8272, lng: 42.9976}
    ]
  },
  {
    name: "Eastern Suburbs",
    color: "#8B5CF6", // Purple
    description: "Eastern expansion areas",
    deliveryFee: 22500,
    coordinates: [
      {lat: 36.8672, lng: 43.0176},
      {lat: 36.8672, lng: 43.0376},
      {lat: 36.8472, lng: 43.0376},
      {lat: 36.8472, lng: 43.0176}
    ]
  },
  {
    name: "Western Outskirts",
    color: "#EF4444", // Red
    description: "Western rural and suburban areas",
    deliveryFee: 25000,
    coordinates: [
      {lat: 36.8672, lng: 42.9776},
      {lat: 36.8672, lng: 42.9976},
      {lat: 36.8472, lng: 42.9976},
      {lat: 36.8472, lng: 42.9776}
    ]
  }
]

export default function ZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [mapConfig, setMapConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddZone, setShowAddZone] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fetch zones and map config
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch map configuration
        const configResponse = await fetch('/api/admin/settings')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setMapConfig(configData.settings)
        }

        // Fetch existing zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones)
        } else {
          // If no zones exist, we'll show the setup option
          console.log('No zones found')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load zones')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSetupDahukZones = async () => {
    try {
      const response = await fetch('/api/admin/zones/setup-dahuk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        toast.success('Dahuk zones created successfully!')
        // Refresh zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create zones')
      }
    } catch (error) {
      console.error('Error creating zones:', error)
      toast.error('Failed to create zones')
    }
  }

  const handleToggleZone = async (zoneId: string) => {
    try {
      const zone = zones.find(z => z.id === zoneId)
      if (!zone) return

      const response = await fetch(`/api/admin/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !zone.isActive
        }),
      })

      if (response.ok) {
        toast.success(`Zone ${!zone.isActive ? 'activated' : 'deactivated'} successfully`)
        // Refresh zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones)
        }
      } else {
        toast.error('Failed to update zone')
      }
    } catch (error) {
      console.error('Error updating zone:', error)
      toast.error('Failed to update zone')
    }
  }

  const getMapPolygons = () => {
    return zones
      .filter(zone => zone.isActive)
      .map(zone => ({
        id: zone.id,
        coordinates: zone.coordinates,
        fillColor: zone.color,
        strokeColor: zone.color,
        fillOpacity: 0.3,
        strokeWeight: 2,
        name: zone.name
      }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading delivery zones...</span>
      </div>
    )
  }

  if (!mapConfig?.googleMapsApiKey) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps Not Configured</h3>
          <p className="text-gray-500 mb-6">
            Configure your Google Maps API key in settings to manage delivery zones
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/admin/settings'}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Zones</h1>
          <p className="text-gray-600 mt-2">
            Manage delivery zones for Dahuk city with different pricing
          </p>
        </div>
        {zones.length === 0 ? (
          <Button 
            onClick={handleSetupDahukZones}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Setup Dahuk Zones
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Zone
          </Button>
        )}
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Zones Configured</h3>
            <p className="text-gray-500 mb-6">
              Set up delivery zones for Dahuk city to enable zone-based pricing and driver assignment
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Dahuk Zone Setup Includes:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Central Dahuk - 15,000 IQD delivery fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Northern Districts - 18,000 IQD delivery fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Southern Districts - 18,000 IQD delivery fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Eastern Suburbs - 22,500 IQD delivery fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Western Outskirts - 25,000 IQD delivery fee</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSetupDahukZones}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Map className="h-4 w-4 mr-2" />
              Setup Dahuk Delivery Zones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Zones Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Dahuk Delivery Zones Map
              </CardTitle>
              <CardDescription>
                Visual representation of delivery zones with different pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMap
                apiKey={mapConfig.googleMapsApiKey}
                center={{ lat: 36.8572, lng: 43.0076 }} // Dahuk center
                zoom={13}
                polygons={getMapPolygons()}
                height="500px"
              />
              
              {/* Zone Legend */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Delivery Zones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-3 text-sm">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${zone.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {zone.name}
                        </span>
                        <p className="text-xs text-gray-500">
                          {zone.deliveryFee?.toLocaleString()} IQD delivery fee
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleZone(zone.id)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          zone.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zones List */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Management</CardTitle>
              <CardDescription>
                Configure delivery fees and settings for each zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center"
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.isActive ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <X className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                        <p className="text-sm text-gray-600">{zone.description}</p>
                        <p className="text-sm font-medium text-blue-600">
                          Delivery Fee: {zone.deliveryFee?.toLocaleString()} IQD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <button
                        onClick={() => handleToggleZone(zone.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          zone.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}