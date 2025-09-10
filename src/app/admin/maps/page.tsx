'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Map, 
  MapPin, 
  Truck, 
  Package, 
  Loader2,
  Settings,
  AlertTriangle,
  Users,
  Navigation
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import GoogleMap from "@/components/GoogleMap"

interface Driver {
  id: string
  user: { name: string }
  vehicleType: string
  vehiclePlate: string
  status: string
  currentLat?: number
  currentLng?: number
}

interface Order {
  id: string
  user: { name: string }
  deliveryAddress: string
  status: string
  driver?: {
    id: string
    user: { name: string }
    currentLat?: number
    currentLng?: number
  }
}

interface MapConfig {
  apiKey: string | null
  defaultLat: number
  defaultLng: number
  deliveryRadius: number
}

export default function AdminMaps() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [zones, setZones] = useState<Array<{id: string, name: string, color: string, coordinates: Array<{lat: number, lng: number}>, isActive: boolean}>>([])
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'drivers' | 'orders' | 'zones' | 'overview'>('overview')

  // Fetch map data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true)
        
        // Fetch map configuration
        const configResponse = await fetch('/api/admin/settings')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData.settings?.googleMapsApiKey) {
            setMapConfig({
              apiKey: configData.settings.googleMapsApiKey,
              defaultLat: configData.settings.mapDefaultLat || 33.3152,
              defaultLng: configData.settings.mapDefaultLng || 44.3661,
              deliveryRadius: configData.settings.deliveryRadius || 25
            })

            // Fetch drivers with location
            const driversResponse = await fetch('/api/admin/drivers')
            if (driversResponse.ok) {
              const driversData = await driversResponse.json()
              setDrivers(driversData.drivers.filter((d: Driver) => d.currentLat && d.currentLng))
            }

            // Fetch active orders
            const ordersResponse = await fetch('/api/admin/orders')
            if (ordersResponse.ok) {
              const ordersData = await ordersResponse.json()
              setOrders(ordersData.orders?.filter((o: Order) => ['ASSIGNED', 'IN_TRANSIT'].includes(o.status)) || [])
            }

            // Fetch delivery zones
            const zonesResponse = await fetch('/api/admin/zones')
            if (zonesResponse.ok) {
              const zonesData = await zonesResponse.json()
              setZones(zonesData.zones || [])
            }
          } else {
            toast.error('Google Maps API key not configured')
          }
        }
      } catch (error) {
        console.error('Error fetching map data:', error)
        toast.error('Failed to load map data')
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
  }, [])

  const getMapMarkers = () => {
    const markers: any[] = []

    if (view === 'drivers' || view === 'overview') {
      drivers.forEach(driver => {
        if (driver.currentLat && driver.currentLng) {
          markers.push({
            id: `driver-${driver.id}`,
            position: { lat: driver.currentLat, lng: driver.currentLng },
            title: `Driver: ${driver.user.name}`,
            info: `${driver.vehicleType} (${driver.vehiclePlate}) - Status: ${driver.status}`,
            type: 'driver'
          })
        }
      })
    }

    if (view === 'orders' || view === 'overview') {
      orders.forEach(order => {
        if (order.driver?.currentLat && order.driver?.currentLng) {
          markers.push({
            id: `order-${order.id}`,
            position: { lat: order.driver.currentLat, lng: order.driver.currentLng },
            title: `Order: ${order.id}`,
            info: `Customer: ${order.user.name} - Status: ${order.status}`,
            type: 'delivery'
          })
        }
      })
    }

    return markers
  }

  const getMapPolygons = () => {
    if (view !== 'zones' && view !== 'overview') return []
    
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
        <span className="ml-3 text-gray-600">Loading map data...</span>
      </div>
    )
  }

  if (!mapConfig?.apiKey) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maps & Tracking</h1>
          <p className="text-gray-600 mt-2">
            View driver locations and delivery tracking on the map
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps Not Configured</h3>
            <p className="text-gray-500 mb-6">
              Configure your Google Maps API key to enable location tracking and visualization
            </p>
            <Link href="/admin/settings">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maps & Tracking</h1>
          <p className="text-gray-600 mt-2">
            Real-time driver locations and delivery tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={view === 'drivers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('drivers')}
          >
            Drivers ({drivers.length})
          </Button>
          <Button
            variant={view === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('orders')}
          >
            Active Orders ({orders.length})
          </Button>
          <Button
            variant={view === 'zones' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('zones')}
          >
            Zones ({zones.length})
          </Button>
        </div>
      </div>

      {/* Map Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'AVAILABLE').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'BUSY').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coverage Area</p>
                <p className="text-2xl font-bold text-gray-900">{mapConfig.deliveryRadius} km</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Live Tracking Map
              </CardTitle>
              <CardDescription>
                Real-time locations of drivers and active deliveries
              </CardDescription>
            </div>
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Map Settings
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <GoogleMap
            apiKey={mapConfig.apiKey!}
            center={{ lat: 36.8572, lng: 43.0076 }} // Dahuk center
            zoom={12}
            markers={getMapMarkers()}
            polygons={getMapPolygons()}
            height="600px"
          />
          
          {/* Map Legend */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center justify-center gap-6 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Available Drivers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Active Deliveries</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">Customer Locations</span>
              </div>
            </div>
            {(view === 'zones' || view === 'overview') && zones.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 text-center mb-2">Delivery Zones</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {zones.filter(z => z.isActive).map(zone => (
                    <div key={zone.id} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 border border-gray-300"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-gray-600">{zone.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      {view === 'drivers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Driver Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drivers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No drivers with location data available</p>
              ) : (
                drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        driver.status === 'AVAILABLE' ? 'bg-green-500' :
                        driver.status === 'BUSY' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{driver.user.name}</p>
                        <p className="text-sm text-gray-600">{driver.vehicleType} - {driver.vehiclePlate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900 capitalize">{driver.status.toLowerCase()}</p>
                      {driver.currentLat && driver.currentLng && (
                        <p className="text-xs text-gray-500">
                          {driver.currentLat.toFixed(4)}, {driver.currentLng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}