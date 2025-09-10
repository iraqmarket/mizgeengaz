'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface GoogleMapWithDrawingProps {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  existingPolygons?: Array<{
    id: string
    coordinates: Array<{ lat: number; lng: number }>
    fillColor: string
    strokeColor: string
    fillOpacity?: number
    strokeWeight?: number
    name?: string
    editable?: boolean
  }>
  height?: string
  drawingMode?: boolean
  selectedColor?: string
  onPolygonComplete?: (coordinates: Array<{ lat: number; lng: number }>) => void
  onPolygonEdit?: (id: string, coordinates: Array<{ lat: number; lng: number }>) => void
  onPolygonDelete?: (id: string) => void
  onMapReady?: (map: google.maps.Map) => void
}

export default function GoogleMapWithDrawing({
  apiKey,
  center = { lat: 36.8572, lng: 43.0076 }, // Dahuk default
  zoom = 13,
  existingPolygons = [],
  height = '500px',
  drawingMode = false,
  selectedColor = '#3B82F6',
  onPolygonComplete,
  onPolygonEdit,
  onPolygonDelete,
  onMapReady
}: GoogleMapWithDrawingProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | undefined
    let timeoutId: NodeJS.Timeout | undefined

    if (!apiKey) {
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.drawing) {
        initializeMap()
        return
      }

      // Check if script is already loading or loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]')
      if (existingScript) {
        checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.drawing) {
            if (checkInterval) clearInterval(checkInterval)
            initializeMap()
          }
        }, 100)
        
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry`
      script.async = true
      script.defer = true
      script.id = 'google-maps-drawing-script'
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
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map

        // Initialize drawing manager
        const drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false, // We'll use our own controls
          polygonOptions: {
            fillColor: selectedColor,
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: selectedColor,
            editable: true,
            draggable: false
          }
        })

        drawingManager.setMap(map)
        drawingManagerRef.current = drawingManager

        // Listen for polygon complete
        google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
          const path = polygon.getPath()
          const coordinates: Array<{ lat: number; lng: number }> = []
          
          for (let i = 0; i < path.getLength(); i++) {
            const latLng = path.getAt(i)
            coordinates.push({
              lat: latLng.lat(),
              lng: latLng.lng()
            })
          }

          if (onPolygonComplete) {
            onPolygonComplete(coordinates)
          }

          // Remove the drawn polygon as we'll add it through props
          polygon.setMap(null)
          
          // Reset drawing mode
          drawingManager.setDrawingMode(null)
        })

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

    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [apiKey, center.lat, center.lng, zoom, selectedColor, onPolygonComplete, onMapReady])

  // Update drawing mode
  useEffect(() => {
    if (!drawingManagerRef.current || loading) return

    if (drawingMode) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
      drawingManagerRef.current.setOptions({
        polygonOptions: {
          fillColor: selectedColor,
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: selectedColor,
          editable: true,
          draggable: false
        }
      })
    } else {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }, [drawingMode, selectedColor, loading])

  // Update existing polygons
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return

    // Clear existing polygons
    polygonsRef.current.forEach(polygon => polygon.setMap(null))
    polygonsRef.current.clear()

    // Add new polygons
    existingPolygons.forEach(polygonData => {
      const polygon = new google.maps.Polygon({
        paths: polygonData.coordinates,
        strokeColor: polygonData.strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: polygonData.strokeWeight || 2,
        fillColor: polygonData.fillColor,
        fillOpacity: polygonData.fillOpacity || 0.3,
        editable: polygonData.editable || false,
        map: mapInstanceRef.current
      })

      // Add click listener for info window
      if (polygonData.name) {
        const infoWindow = new google.maps.InfoWindow()
        
        polygon.addListener('click', (event: any) => {
          const content = `
            <div style="padding: 12px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${polygonData.name}</h4>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 20px; height: 20px; background-color: ${polygonData.fillColor}; border: 1px solid #ccc; border-radius: 4px;"></div>
                <span style="font-size: 14px; color: #666;">Zone Color</span>
              </div>
              ${polygonData.editable ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5;">
                  <p style="margin: 0; font-size: 12px; color: #999;">Click and drag vertices to edit</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">Right-click on a vertex to delete it</p>
                </div>
              ` : ''}
            </div>
          `
          infoWindow.setContent(content)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(mapInstanceRef.current)
        })
      }

      // Add edit listeners if editable
      if (polygonData.editable && onPolygonEdit) {
        const updateCoordinates = () => {
          const path = polygon.getPath()
          const coordinates: Array<{ lat: number; lng: number }> = []
          
          for (let i = 0; i < path.getLength(); i++) {
            const latLng = path.getAt(i)
            coordinates.push({
              lat: latLng.lat(),
              lng: latLng.lng()
            })
          }
          
          onPolygonEdit(polygonData.id, coordinates)
        }

        polygon.getPath().addListener('set_at', updateCoordinates)
        polygon.getPath().addListener('insert_at', updateCoordinates)
        polygon.getPath().addListener('remove_at', updateCoordinates)
      }

      // Add right-click to delete if editable
      if (polygonData.editable && onPolygonDelete) {
        polygon.addListener('rightclick', () => {
          if (confirm(`Delete zone "${polygonData.name}"?`)) {
            polygon.setMap(null)
            onPolygonDelete(polygonData.id)
          }
        })
      }

      polygonsRef.current.set(polygonData.id, polygon)
    })

    // Adjust bounds to show all polygons
    if (existingPolygons.length > 0 && !drawingMode) {
      const bounds = new google.maps.LatLngBounds()
      existingPolygons.forEach(polygon => {
        polygon.coordinates.forEach(coord => {
          bounds.extend(coord)
        })
      })
      mapInstanceRef.current?.fitBounds(bounds)
    }
  }, [existingPolygons, loading, drawingMode, onPolygonEdit, onPolygonDelete])

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