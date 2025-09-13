'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  MapPin,
  Navigation,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Map,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import GoogleMap from '@/components/GoogleMap'
import { DeliveryZone, LocationPoint, findZoneForLocation, validateLocationForDelivery } from '@/lib/zones'

interface ZoneAwareLocationPickerProps {
  apiKey: string
  defaultCenter: LocationPoint
  onLocationChange: (location: {
    lat: number
    lng: number
    address: string
    zone?: DeliveryZone
    isServiceable: boolean
  }) => void
  selectedLocation?: {
    lat: number
    lng: number
    address: string
  }
}

export default function ZoneAwareLocationPicker({
  apiKey,
  defaultCenter,
  onLocationChange,
  selectedLocation
}: ZoneAwareLocationPickerProps) {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<{
    isServiceable: boolean
    zone?: DeliveryZone
    message: string
    suggestions?: string[]
    deliveryFee?: number
  } | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(
    selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null
  )

  // Fetch delivery zones
  useEffect(() => {
    const fetchZones = async () => {
      console.log('🗺️ [LocationPicker] Fetching delivery zones...')
      try {
        setLoading(true)
        const response = await fetch('/api/zones')
        console.log('📡 [LocationPicker] Zones API response status:', response.status, response.statusText)

        if (response.ok) {
          const data = await response.json()
          console.log('🌍 [LocationPicker] Zones data received:', data)
          console.log(`📊 [LocationPicker] Found ${data.zones?.length || 0} delivery zones`)
          setZones(data.zones || [])
        } else {
          console.error('❌ [LocationPicker] Failed to fetch zones, status:', response.status)
          toast.error('Failed to load delivery zones')
        }
      } catch (error) {
        console.error('❌ [LocationPicker] Error fetching zones:', error)
        toast.error('Failed to load delivery zones')
      } finally {
        setLoading(false)
        console.log('✅ [LocationPicker] Zone fetching completed')
      }
    }

    fetchZones()
  }, [])

  // Update location status when location or zones change
  useEffect(() => {
    if (currentLocation && zones.length > 0) {
      console.log('🔄 [LocationPicker] Validating location against zones...')
      console.log('📍 [LocationPicker] Current location:', currentLocation)
      console.log('🌍 [LocationPicker] Available zones:', zones.map(z => ({ id: z.id, name: z.name })))

      const validation = validateLocationForDelivery(currentLocation, zones)
      console.log('✅ [LocationPicker] Validation result:', validation)

      setLocationStatus(validation)

      // Notify parent component
      const locationData = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: manualAddress || selectedLocation?.address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
        zone: validation.zone || undefined,
        isServiceable: validation.isServiceable
      }

      console.log('📤 [LocationPicker] Current state before notifying parent:')
      console.log('   - manualAddress:', manualAddress)
      console.log('   - selectedLocation?.address:', selectedLocation?.address)
      console.log('   - Final address being sent:', locationData.address)
      console.log('📤 [LocationPicker] Notifying parent component with location data:', locationData)
      onLocationChange(locationData)
    }
  }, [currentLocation, zones, onLocationChange, selectedLocation?.address, manualAddress])

  const detectCurrentLocation = useCallback(async () => {
    console.log('🎯 [LocationPicker] Starting location detection...')

    if (!navigator.geolocation) {
      console.error('❌ [LocationPicker] Geolocation is not supported by this browser')
      toast.error('Geolocation is not supported by your browser')
      return
    }

    console.log('✅ [LocationPicker] Geolocation API is available')
    setIsDetectingLocation(true)

    // Try multiple strategies with different options
    const strategies = [
      {
        name: 'High Accuracy GPS',
        options: {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        }
      },
      {
        name: 'Network/Wi-Fi Location',
        options: {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000 // Allow 1 minute cache
        }
      },
      {
        name: 'Fast Location (Cached)',
        options: {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // Allow 5 minute cache
        }
      }
    ]

    for (const strategy of strategies) {
      console.log(`📡 [LocationPicker] Trying strategy: ${strategy.name}`)
      console.log('📋 [LocationPicker] Options:', strategy.options)

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            console.log(`⏰ [LocationPicker] ${strategy.name} timed out`)
            reject(new Error(`${strategy.name} timed out`))
          }, strategy.options.timeout)

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId)
              console.log(`✅ [LocationPicker] ${strategy.name} succeeded`)
              resolve(pos)
            },
            (err) => {
              clearTimeout(timeoutId)
              console.log(`❌ [LocationPicker] ${strategy.name} failed:`, err)
              reject(err)
            },
            strategy.options
          )
        })

        const { latitude, longitude, accuracy, timestamp } = position.coords
        console.log('🎉 [LocationPicker] Location detected successfully!')
        console.log(`📍 [LocationPicker] Coordinates: ${latitude}, ${longitude}`)
        console.log(`📏 [LocationPicker] Accuracy: ${accuracy} meters`)
        console.log(`⏰ [LocationPicker] Timestamp: ${timestamp ? new Date(timestamp).toISOString() : 'Not available'}`)
        console.log(`🚀 [LocationPicker] Successful strategy: ${strategy.name}`)

        const newLocation = { lat: latitude, lng: longitude }
        setCurrentLocation(newLocation)

        // Try reverse geocoding
        console.log('🔄 [LocationPicker] Starting reverse geocoding...')
        try {
          const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          console.log('🌐 [LocationPicker] Geocoding URL:', geocodingUrl)

          const response = await fetch(geocodingUrl)
          console.log('📡 [LocationPicker] Geocoding response status:', response.status, response.statusText)

          if (response.ok) {
            const data = await response.json()
            console.log('🗺️ [LocationPicker] Geocoding data:', data)

            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            console.log('📍 [LocationPicker] Resolved address:', address)
            console.log('📤 [LocationPicker] Setting manualAddress to:', address)
            setManualAddress(address)
          } else {
            console.warn('⚠️ [LocationPicker] Geocoding failed with status:', response.status)
            const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            console.log('🔄 [LocationPicker] Using fallback address:', fallbackAddress)
            setManualAddress(fallbackAddress)
          }
        } catch (error) {
          console.error('❌ [LocationPicker] Reverse geocoding failed:', error)
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          console.log('🔄 [LocationPicker] Using fallback coordinates as address:', fallbackAddress)
          setManualAddress(fallbackAddress)
        }

        setIsDetectingLocation(false)
        console.log('✅ [LocationPicker] Location detection process completed successfully')
        toast.success(`Location detected using ${strategy.name}!`)
        return // Success, exit the function

      } catch (error: any) {
        console.warn(`⚠️ [LocationPicker] ${strategy.name} failed, trying next strategy...`)
        console.log('Error details:', error)
        // Continue to next strategy
      }
    }

    // All strategies failed
    console.error('❌ [LocationPicker] All location detection strategies failed')
    setIsDetectingLocation(false)

    // Check for specific error conditions and provide better guidance
    console.log('🔍 [LocationPicker] Checking browser location settings...')

    // Check if HTTPS is being used
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.log('⚠️ [LocationPicker] Not using HTTPS - this may block geolocation')
      toast.error('Location access requires HTTPS. Please use a secure connection or try clicking on the map to select your location manually.')
      return
    }

    // Check permissions API if available
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        console.log('🔐 [LocationPicker] Geolocation permission status:', permissionStatus.state)

        switch (permissionStatus.state) {
          case 'denied':
            toast.error('Location access is blocked. Please enable location permissions in your browser settings and refresh the page.')
            break
          case 'prompt':
            toast.error('Please allow location access when prompted, or click on the map to select your location manually.')
            break
          case 'granted':
            // Permission is granted but still failing - likely device/OS issue
            console.log('🔍 [LocationPicker] Permission granted but location unavailable - checking device capabilities...')

            // Check if we're in a secure context
            const isSecureContext = window.isSecureContext
            console.log('🔒 [LocationPicker] Secure context:', isSecureContext)

            // Check user agent for clues
            console.log('🖥️ [LocationPicker] User agent:', navigator.userAgent)

            // Check if we're in an iframe or embedded context
            const isInIframe = window !== window.top
            console.log('🪟 [LocationPicker] In iframe:', isInIframe)

            toast.error(`Location services are not available on this device/browser. This could be due to:

• Location services disabled at system level
• Running in a virtual machine or emulator
• Browser running in restricted mode
• Device doesn't have GPS/location hardware

Please click on the map to manually select your location.`)
            break
          default:
            toast.error('Unable to detect your location. Please ensure GPS/location services are enabled on your device, or click on the map to select your location manually.')
        }
      } catch (permError) {
        console.log('❌ [LocationPicker] Could not check permissions:', permError)
        toast.error('Unable to detect your location. Please click on the map to select your location manually, or check your browser\'s location settings.')
      }
    } else {
      toast.error('Unable to detect your location. Please click on the map to select your location manually.')
    }
  }, [])

  const handleMapClick = useCallback(async (event: any) => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    console.log('🗺️ [LocationPicker] Map clicked at coordinates:', lat, lng)

    const newLocation = { lat, lng }
    setCurrentLocation(newLocation)

    // Reverse geocoding
    console.log('🔄 [LocationPicker] Starting reverse geocoding for map click...')
    try {
      const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      console.log('🌐 [LocationPicker] Map click geocoding URL:', geocodingUrl)

      const response = await fetch(geocodingUrl)
      console.log('📡 [LocationPicker] Map click geocoding response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🗺️ [LocationPicker] Map click geocoding data:', data)

        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        console.log('📍 [LocationPicker] Map click resolved address:', address)
        setManualAddress(address)
      } else {
        console.warn('⚠️ [LocationPicker] Map click geocoding failed, using coordinates')
        setManualAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    } catch (error) {
      console.error('❌ [LocationPicker] Map click reverse geocoding failed:', error)
      setManualAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }, [])

  const getMapCenter = () => {
    if (currentLocation) {
      return currentLocation
    }
    return defaultCenter
  }

  const getMapMarkers = () => {
    if (!currentLocation) return []

    return [{
      id: 'selected-location',
      position: currentLocation,
      title: 'Selected Location',
      info: manualAddress || 'Your selected location',
      type: locationStatus?.isServiceable ? 'customer' : 'warning'
    }]
  }

  const getMapPolygons = () => {
    return zones.map(zone => ({
      id: zone.id,
      coordinates: zone.coordinates,
      fillColor: zone.color,
      strokeColor: zone.color,
      fillOpacity: locationStatus?.zone?.id === zone.id ? 0.4 : 0.2,
      strokeWeight: locationStatus?.zone?.id === zone.id ? 3 : 1,
      name: zone.name
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading delivery zones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zone Status Card */}
      {locationStatus && (
        <Card className={`border-2 ${
          locationStatus.isServiceable
            ? 'border-green-200 bg-green-50'
            : 'border-orange-200 bg-orange-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {locationStatus.isServiceable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  locationStatus.isServiceable ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {locationStatus.message}
                </p>

                {locationStatus.isServiceable && locationStatus.zone && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Zone:</span> {locationStatus.zone.name}
                      {locationStatus.deliveryFee !== undefined && locationStatus.deliveryFee > 0 && (
                        <span className="ml-2">
                          <span className="font-medium">Delivery Fee:</span> {locationStatus.deliveryFee.toLocaleString()} IQD
                        </span>
                      )}
                    </p>
                    {locationStatus.zone.description && (
                      <p className="mt-1 text-xs opacity-80">{locationStatus.zone.description}</p>
                    )}
                  </div>
                )}

                {!locationStatus.isServiceable && locationStatus.suggestions && (
                  <div className="mt-2 text-sm text-orange-700">
                    <p className="font-medium">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {locationStatus.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-xs">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Your Location
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-2"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {isDetectingLocation ? 'Detecting...' : 'Use Current Location'}
              </Button>
            </div>

            {/* Address Input */}
            <div>
              <Label htmlFor="address" className="text-sm text-gray-600">
                Address (will be auto-filled when you select a location)
              </Label>
              <Input
                id="address"
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter your address or click on the map"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Map className="h-4 w-4" />
                Delivery Zone Map
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Info className="h-4 w-4 mr-1" />
                {showAdvanced ? 'Hide' : 'Show'} Zone Info
              </Button>
            </div>

            {/* Zone Information */}
            {showAdvanced && zones.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Available Delivery Zones:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zones.map(zone => (
                    <div key={zone.id} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-blue-800">
                        {zone.name}
                        {zone.deliveryFee && zone.deliveryFee > 0 && (
                          <span className="text-blue-600 ml-1">
                            ({zone.deliveryFee.toLocaleString()} IQD)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="relative">
              <GoogleMap
                apiKey={apiKey}
                center={getMapCenter()}
                zoom={currentLocation ? 15 : 12}
                height="400px"
                markers={getMapMarkers()}
                polygons={getMapPolygons()}
                onMapReady={(map) => {
                  map.addListener('click', handleMapClick)
                }}
              />

              {/* Map Instructions */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>How to use:</strong> Click anywhere on the map to set your location, or use "Use Current Location" to auto-detect.
                    Colored areas show our delivery zones - green indicates you're in a serviceable area.
                  </span>
                </p>
              </div>

              {/* Troubleshooting help */}
              <details className="mt-2">
                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                  Having trouble with location detection? Click for help
                </summary>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-blue-900">If "Use Current Location" isn't working:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800 mt-1">
                        <li>Make sure you're using HTTPS (secure connection)</li>
                        <li>Enable location permissions when prompted by your browser</li>
                        <li>Check that location services are enabled on your device</li>
                        <li>Try refreshing the page and allowing location access</li>
                        <li>As an alternative, simply click on the map where you're located</li>
                      </ul>
                    </div>

                    <div className="border-t border-blue-200 pt-2">
                      <p className="font-medium text-blue-900">For "Position Unavailable" errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800 mt-1">
                        <li><strong>Windows:</strong> Check Settings → Privacy → Location services</li>
                        <li><strong>Mac:</strong> Check System Preferences → Security & Privacy → Location Services</li>
                        <li><strong>Mobile:</strong> Check device location settings in Settings</li>
                        <li>Try using a different browser (Chrome, Firefox, Safari)</li>
                        <li>Restart your browser and try again</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="text-amber-800 font-medium">💡 Quick Solution:</p>
                      <p className="text-amber-700">Click directly on the map where you're located - this works just as well as auto-detection!</p>
                    </div>

                    <p className="text-blue-700">
                      <strong>Browser settings:</strong> Look for a location icon 🌍 in your address bar and make sure it's not blocked.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Summary */}
      {currentLocation && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-mono text-gray-900">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </span>
              </div>
              {manualAddress && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-gray-600">Address:</span>
                  <span className="text-gray-900 text-right flex-1">{manualAddress}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}