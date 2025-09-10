'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface GoogleMapProps {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    position: { lat: number; lng: number }
    title: string
    info?: string
    type?: 'driver' | 'delivery' | 'customer'
  }>
  polygons?: Array<{
    id: string
    coordinates: Array<{ lat: number; lng: number }>
    fillColor: string
    strokeColor: string
    fillOpacity?: number
    strokeWeight?: number
    name?: string
  }>
  height?: string
  onMapReady?: (map: google.maps.Map) => void
}

export default function GoogleMap({
  apiKey,
  center = { lat: 33.3152, lng: 44.3661 }, // Baghdad default
  zoom = 12,
  markers = [],
  polygons = [],
  height = '400px',
  onMapReady
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polygonsRef = useRef<google.maps.Polygon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | undefined
    let timeoutId: NodeJS.Timeout | undefined

    if (!apiKey) {
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Check if script is already loading or loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]')
      if (existingScript) {
        // Script already exists, wait for it to load
        checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            if (checkInterval) clearInterval(checkInterval)
            initializeMap()
          }
        }, 100)
        
        // Set a timeout to prevent infinite waiting
        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval)
          if (!window.google || !window.google.maps) {
            setError('Google Maps is still loading, please refresh')
            setLoading(false)
          }
        }, 5000)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
      script.async = true
      script.defer = true
      script.id = 'google-maps-script'
      script.onload = () => {
        if (window.google && window.google.maps) {
          initializeMap()
        } else {
          setError('Failed to load Google Maps')
          setLoading(false)
        }
      }
      script.onerror = () => {
        setError('Failed to load Google Maps script')
        setLoading(false)
      }
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      try {
        const map = new google.maps.Map(mapRef.current, {
          zoom,
          center,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map
        setLoading(false)
        
        if (onMapReady) {
          onMapReady(map)
        }
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to initialize map')
        setLoading(false)
      }
    }

    loadGoogleMaps()

    // Cleanup function
    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [apiKey, center.lat, center.lng, zoom, onMapReady])

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: getMarkerIcon(markerData.type)
      })

      if (markerData.info) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 4px 0; font-weight: bold;">${markerData.title}</h4>
              <p style="margin: 0; font-size: 12px; color: #666;">${markerData.info}</p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })
      }

      markersRef.current.push(marker)
    })

    // Adjust map bounds to show all markers
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(marker => {
        bounds.extend(marker.position)
      })
      mapInstanceRef.current?.fitBounds(bounds)
    }
  }, [markers, loading])

  // Update polygons when they change
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return

    // Clear existing polygons
    polygonsRef.current.forEach(polygon => polygon.setMap(null))
    polygonsRef.current = []

    // Add new polygons
    polygons.forEach(polygonData => {
      const polygon = new google.maps.Polygon({
        paths: polygonData.coordinates,
        strokeColor: polygonData.strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: polygonData.strokeWeight || 2,
        fillColor: polygonData.fillColor,
        fillOpacity: polygonData.fillOpacity || 0.3,
        map: mapInstanceRef.current
      })

      if (polygonData.name) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 4px 0; font-weight: bold;">${polygonData.name}</h4>
              <p style="margin: 0; font-size: 12px; color: #666;">Delivery Zone</p>
            </div>
          `
        })

        polygon.addListener('click', (event: any) => {
          infoWindow.setPosition(event.latLng)
          infoWindow.open(mapInstanceRef.current)
        })
      }

      polygonsRef.current.push(polygon)
    })

    // Adjust bounds to show all polygons if no markers
    if (markers.length === 0 && polygons.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      polygons.forEach(polygon => {
        polygon.coordinates.forEach(coord => {
          bounds.extend(coord)
        })
      })
      mapInstanceRef.current?.fitBounds(bounds)
    }
  }, [polygons, loading, markers.length])

  const getMarkerIcon = (type?: string) => {
    switch (type) {
      case 'driver':
        return {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" stroke-width="3"/>
              <path d="M12 10h8v4l-2 2v6h-4v-6l-2-2V10z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      case 'delivery':
        return {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="3"/>
              <path d="M10 14h12v2H10v-2zm2-4h8v2H12v-2zm2 8h4v2h-4v-2z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      case 'customer':
        return {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#F59E0B" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="12" r="4" fill="white"/>
              <path d="M8 24c0-4.5 3.5-8 8-8s8 3.5 8 8" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      default:
        return undefined // Use default Google Maps marker
    }
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Map Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading map...</span>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ height }}
      />
    </div>
  )
}