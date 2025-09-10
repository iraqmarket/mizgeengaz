'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlacesAutocompleteProps {
  apiKey: string
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  defaultValue?: string
  className?: string
  restrictToCountry?: string
  focusArea?: { lat: number; lng: number; radius: number }
}

export default function PlacesAutocomplete({
  apiKey,
  onPlaceSelect,
  placeholder = 'Search for a location...',
  defaultValue = '',
  className = '',
  restrictToCountry = 'IQ', // Iraq
  focusArea = { lat: 36.8572, lng: 43.0076, radius: 50000 } // Dahuk area, 50km radius
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [value, setValue] = useState(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Google Maps is already loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete()
        return true
      }
      return false
    }

    if (checkGoogleMaps()) {
      return
    }

    // Wait for Google Maps to load
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)

    // Cleanup
    return () => {
      clearInterval(interval)
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current || autocompleteRef.current) return

    try {
      // Create autocomplete instance
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: restrictToCountry },
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types', 'address_components'],
        types: ['geocode', 'establishment'],
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(focusArea.lat - 0.5, focusArea.lng - 0.5),
          new google.maps.LatLng(focusArea.lat + 0.5, focusArea.lng + 0.5)
        ),
        strictBounds: false
      })

      // Add place changed listener
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry && onPlaceSelect) {
          onPlaceSelect(place)
          setValue(place.name || place.formatted_address || '')
        }
      })

      autocompleteRef.current = autocomplete
      setIsLoaded(true)
    } catch (error) {
      console.error('Error initializing autocomplete:', error)
    }
  }

  const handleClear = () => {
    setValue('')
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}