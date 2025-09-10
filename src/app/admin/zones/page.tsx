'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  AlertCircle,
  Palette,
  DollarSign,
  Navigation,
  MousePointer,
  Pencil,
  Search,
  Sparkles,
  Home
} from "lucide-react"
import { toast } from "sonner"
import GoogleMapWithDrawing from "@/components/GoogleMapWithDrawing"
import PlacesAutocomplete from "@/components/PlacesAutocomplete"
import { dahukLocations, suggestedZones, getZoneBoundary } from "@/lib/dahuk-locations"

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

// Predefined color palette for zones
const zoneColors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Lime', value: '#84CC16' }
]

export default function ZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [mapConfig, setMapConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [drawnCoordinates, setDrawnCoordinates] = useState<Array<{lat: number, lng: number}> | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 36.8572, lng: 43.0076 })
  const [mapZoom, setMapZoom] = useState(13)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mapRef = useRef<google.maps.Map | null>(null)
  
  // Form state for new/edit zone
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: '',
    deliveryFee: '',
    color: '#3B82F6',
    isActive: true
  })

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
          setZones(zonesData.zones || [])
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

  const handleStartDrawing = () => {
    setIsDrawing(true)
    setShowZoneForm(false)
    setEditingZone(null)
    setShowSuggestions(false)
    toast.info('Click on the map to draw zone boundaries')
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setDrawnCoordinates(null)
    setShowZoneForm(false)
    setZoneForm({
      name: '',
      description: '',
      deliveryFee: '',
      color: '#3B82F6',
      isActive: true
    })
  }

  const handlePolygonComplete = (coordinates: Array<{lat: number, lng: number}>) => {
    setDrawnCoordinates(coordinates)
    setIsDrawing(false)
    setShowZoneForm(true)
    toast.success('Zone boundary drawn! Now fill in the details.')
  }

  const handlePolygonEdit = async (zoneId: string, coordinates: Array<{lat: number, lng: number}>) => {
    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates }),
      })

      if (response.ok) {
        toast.success('Zone boundary updated')
        // Refresh zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones || [])
        }
      } else {
        toast.error('Failed to update zone boundary')
      }
    } catch (error) {
      console.error('Error updating zone:', error)
      toast.error('Failed to update zone')
    }
  }

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      
      // Center map on selected location
      setMapCenter({ lat, lng })
      setMapZoom(15)
      
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng })
        mapRef.current.setZoom(15)
      }
      
      toast.success(`Navigated to ${place.name || place.formatted_address}`)
    }
  }

  const handleLocationClick = (location: typeof dahukLocations[0]) => {
    setMapCenter({ lat: location.lat, lng: location.lng })
    setMapZoom(15)
    
    if (mapRef.current) {
      mapRef.current.setCenter({ lat: location.lat, lng: location.lng })
      mapRef.current.setZoom(15)
    }
    
    setSearchQuery('')
    toast.success(`Navigated to ${location.name}`)
  }

  const handleQuickZoneCreate = (suggestion: typeof suggestedZones[0]) => {
    // Calculate zone boundary based on villages
    const villageCoords = suggestion.villages
      .map(villageName => dahukLocations.find(loc => loc.name === villageName))
      .filter(Boolean) as typeof dahukLocations

    if (villageCoords.length > 0) {
      // Calculate center point
      const centerLat = villageCoords.reduce((sum, loc) => sum + loc.lat, 0) / villageCoords.length
      const centerLng = villageCoords.reduce((sum, loc) => sum + loc.lng, 0) / villageCoords.length
      
      // Create zone boundary
      const boundary = getZoneBoundary(centerLat, centerLng, 3) // 3km radius
      
      setDrawnCoordinates(boundary)
      setZoneForm({
        name: suggestion.name,
        description: suggestion.description,
        deliveryFee: suggestion.suggestedFee.toString(),
        color: suggestion.color,
        isActive: true
      })
      setSelectedColor(suggestion.color)
      setShowZoneForm(true)
      setShowSuggestions(false)
      
      // Center map on the zone
      setMapCenter({ lat: centerLat, lng: centerLng })
      setMapZoom(13)
      
      toast.info('Zone boundary created! Adjust if needed and save.')
    }
  }

  const handleSaveZone = async () => {
    if (!drawnCoordinates || drawnCoordinates.length < 3) {
      toast.error('Please draw a valid zone boundary')
      return
    }

    if (!zoneForm.name.trim()) {
      toast.error('Please enter a zone name')
      return
    }

    if (!zoneForm.deliveryFee || parseFloat(zoneForm.deliveryFee) <= 0) {
      toast.error('Please enter a valid delivery fee')
      return
    }

    try {
      const response = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: zoneForm.name,
          description: zoneForm.description,
          deliveryFee: parseFloat(zoneForm.deliveryFee),
          color: zoneForm.color,
          coordinates: drawnCoordinates,
          isActive: zoneForm.isActive
        }),
      })

      if (response.ok) {
        toast.success('Zone created successfully!')
        handleCancelDrawing()
        // Refresh zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones || [])
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create zone')
      }
    } catch (error) {
      console.error('Error creating zone:', error)
      toast.error('Failed to create zone')
    }
  }

  const handleUpdateZone = async (zoneId: string, updates: Partial<DeliveryZone>) => {
    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('Zone updated successfully')
        // Refresh zones
        const zonesResponse = await fetch('/api/admin/zones')
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          setZones(zonesData.zones || [])
        }
      } else {
        toast.error('Failed to update zone')
      }
    } catch (error) {
      console.error('Error updating zone:', error)
      toast.error('Failed to update zone')
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Zone deleted successfully')
        setZones(zones.filter(z => z.id !== zoneId))
      } else {
        toast.error('Failed to delete zone')
      }
    } catch (error) {
      console.error('Error deleting zone:', error)
      toast.error('Failed to delete zone')
    }
  }

  const getMapPolygons = () => {
    const polygons = zones.map(zone => ({
      id: zone.id,
      coordinates: zone.coordinates,
      fillColor: zone.color,
      strokeColor: zone.color,
      fillOpacity: zone.isActive ? 0.3 : 0.1,
      strokeWeight: 2,
      name: zone.name,
      editable: editingZone === zone.id
    }))

    // Add the currently drawing polygon if exists
    if (drawnCoordinates && drawnCoordinates.length > 0) {
      polygons.push({
        id: 'new-zone',
        coordinates: drawnCoordinates,
        fillColor: zoneForm.color,
        strokeColor: zoneForm.color,
        fillOpacity: 0.3,
        strokeWeight: 2,
        name: 'New Zone',
        editable: false
      })
    }

    return polygons
  }

  const filteredLocations = dahukLocations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            Draw and manage delivery zones with custom pricing
          </p>
        </div>
        <div className="flex gap-2">
          {isDrawing ? (
            <Button 
              onClick={handleCancelDrawing}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => setShowSuggestions(!showSuggestions)}
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Setup
              </Button>
              <Button 
                onClick={handleStartDrawing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Zone
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Location Search and Quick Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search Box */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Location Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PlacesAutocomplete
                apiKey={mapConfig.googleMapsApiKey}
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for villages, districts, or landmarks in Dahuk..."
              />
              
              {/* Quick Location Buttons */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Quick Navigation:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLocationClick({ name: 'Dahuk City Center', lat: 36.8572, lng: 43.0076, type: 'district' })}
                  >
                    <Home className="h-3 w-3 mr-1" />
                    City Center
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLocationClick({ name: 'Semel', lat: 36.8583, lng: 42.8511, type: 'town' })}
                  >
                    Semel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLocationClick({ name: 'Zakho', lat: 37.1441, lng: 42.6821, type: 'city' })}
                  >
                    Zakho Road
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLocationClick({ name: 'Amadiya', lat: 37.0925, lng: 43.4873, type: 'town' })}
                  >
                    Amadiya Road
                  </Button>
                </div>
              </div>

              {/* Village List */}
              <div>
                <Label className="text-sm text-gray-600">Villages & Districts:</Label>
                <Input
                  type="text"
                  placeholder="Filter locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 mb-2"
                />
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {filteredLocations.slice(0, 20).map((location) => (
                      <button
                        key={location.name}
                        onClick={() => handleLocationClick(location)}
                        className="text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="truncate">{location.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {location.type === 'village' && 'V'}
                          {location.type === 'district' && 'D'}
                          {location.type === 'town' && 'T'}
                          {location.type === 'city' && 'C'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Zone Suggestions */}
        {showSuggestions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Suggested Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestedZones.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion.name}
                    onClick={() => handleQuickZoneCreate(suggestion)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex-shrink-0 mt-1"
                        style={{ backgroundColor: suggestion.color + '30', borderColor: suggestion.color, borderWidth: 2 }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{suggestion.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{suggestion.description}</p>
                        <p className="text-xs font-medium text-blue-600 mt-1">
                          {suggestion.suggestedFee.toLocaleString()} IQD
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Drawing Instructions */}
      {isDrawing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-blue-600" />
              <p className="text-blue-900 font-medium">Drawing Mode Active</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Click on the map to create zone boundaries. Click on the first point to complete the zone.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Zone Form */}
      {showZoneForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Zone Details</CardTitle>
            <CardDescription>Configure the zone properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                  placeholder="e.g., Downtown Area"
                />
              </div>
              <div>
                <Label htmlFor="fee">Delivery Fee (IQD) *</Label>
                <Input
                  id="fee"
                  type="number"
                  value={zoneForm.deliveryFee}
                  onChange={(e) => setZoneForm({...zoneForm, deliveryFee: e.target.value})}
                  placeholder="e.g., 15000"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={zoneForm.description}
                  onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})}
                  placeholder="Optional description of the zone"
                  rows={2}
                />
              </div>
              <div>
                <Label>Zone Color</Label>
                <div className="flex gap-2 mt-2">
                  {zoneColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setZoneForm({...zoneForm, color: color.value})}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        zoneForm.color === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={zoneForm.isActive}
                  onCheckedChange={(checked) => setZoneForm({...zoneForm, isActive: checked})}
                />
                <Label>Active Zone</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCancelDrawing}>
                Cancel
              </Button>
              <Button onClick={handleSaveZone} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Zone
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Zone Map
              </CardTitle>
              <CardDescription>
                {isDrawing ? 'Draw zone boundaries on the map' : 'View and manage delivery zones'}
              </CardDescription>
            </div>
            {isDrawing && (
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-500" />
                <div className="flex gap-1">
                  {zoneColors.slice(0, 5).map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        setSelectedColor(color.value)
                        setZoneForm({...zoneForm, color: color.value})
                      }}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        selectedColor === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <GoogleMapWithDrawing
            apiKey={mapConfig.googleMapsApiKey}
            center={mapCenter}
            zoom={mapZoom}
            existingPolygons={getMapPolygons()}
            height="500px"
            drawingMode={isDrawing}
            selectedColor={selectedColor}
            onPolygonComplete={handlePolygonComplete}
            onPolygonEdit={handlePolygonEdit}
            onPolygonDelete={handleDeleteZone}
            onMapReady={(map) => { mapRef.current = map }}
          />
        </CardContent>
      </Card>

      {/* Zones List */}
      {zones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Zones ({zones.length})</CardTitle>
            <CardDescription>
              Manage zone settings and delivery fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    zone.isActive ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: zone.color + '20', borderColor: zone.color, borderWidth: 2 }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: zone.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      {zone.description && (
                        <p className="text-sm text-gray-600">{zone.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm font-medium text-blue-600">
                          <DollarSign className="h-3 w-3 inline" />
                          {zone.deliveryFee?.toLocaleString()} IQD
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          zone.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingZone(editingZone === zone.id ? null : zone.id)
                        toast.info(editingZone === zone.id ? 'Edit mode disabled' : 'Edit mode enabled - modify zone on map')
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={zone.isActive}
                      onCheckedChange={(checked) => handleUpdateZone(zone.id, { isActive: checked })}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}