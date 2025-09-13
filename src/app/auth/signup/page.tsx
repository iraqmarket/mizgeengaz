'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Truck, MapPin, Navigation, Loader2, ChevronRight, ChevronLeft, Check, User, Mail, Lock, Phone, Home, Building2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import ZoneAwareLocationPicker from "@/components/ZoneAwareLocationPicker"
import { DeliveryZone } from "@/lib/zones"

type AddressType = 'HOME' | 'BUSINESS' | 'APARTMENT'

export default function SignUp() {
  // Form data state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [addressType, setAddressType] = useState<AddressType>('HOME')
  const [address, setAddress] = useState("")
  const [mapPinLat, setMapPinLat] = useState("")
  const [mapPinLng, setMapPinLng] = useState("")
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [locationServiceable, setLocationServiceable] = useState<boolean | null>(null)
  const [complexName, setComplexName] = useState("")
  const [buildingNumber, setBuildingNumber] = useState("")
  const [floorNumber, setFloorNumber] = useState("")
  const [apartmentNumber, setApartmentNumber] = useState("")
  const [city, setCity] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [locationValidationError, setLocationValidationError] = useState<string | null>(null)
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
  const [mapDefaultLat, setMapDefaultLat] = useState(33.3152)
  const [mapDefaultLng, setMapDefaultLng] = useState(44.3661)
  const [userLocationLat, setUserLocationLat] = useState<number | null>(null)
  const [userLocationLng, setUserLocationLng] = useState<number | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [stepErrors, setStepErrors] = useState<{[key: number]: string[]}>({})
  
  const router = useRouter()
  const totalSteps = 3

  // Get user's current location for map centering
  const getUserLocation = async (showFeedback = false) => {
    if (!navigator.geolocation) {
      if (showFeedback) {
        toast.error('Geolocation is not supported by this browser')
      }
      return false
    }

    if (showFeedback) {
      setIsGettingLocation(true)
    }

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocationLat(latitude)
          setUserLocationLng(longitude)
          
          if (showFeedback) {
            // Also update the map pin coordinates
            setMapPinLat(latitude.toString())
            setMapPinLng(longitude.toString())
            
            // Try reverse geocoding to get address
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
              )
              
              if (response.ok) {
                const data = await response.json()
                if (data.address) {
                  setCity(data.address.city || data.address.town || data.address.village || '')
                  setNeighborhood(data.address.suburb || data.address.neighbourhood || '')
                  setAddress(data.display_name || `${latitude}, ${longitude}`)
                }
              } else {
                setAddress(`${latitude}, ${longitude}`)
              }
            } catch (error) {
              console.error('Reverse geocoding failed:', error)
              setAddress(`${latitude}, ${longitude}`)
            }
            
            toast.success('Location detected successfully!')
          }
          
          setIsGettingLocation(false)
          resolve(true)
        },
        (error) => {
          console.log('Geolocation failed:', error)
          setIsGettingLocation(false)
          
          if (showFeedback) {
            let errorMessage = 'Failed to get your location. '
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Location access was denied. Please enable location access and try again.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.'
                break
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.'
                break
              default:
                errorMessage += 'An unknown error occurred.'
                break
            }
            toast.error(errorMessage)
          }
          
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes cache
        }
      )
    })
  }

  // Fetch app settings and user location on component mount
  useEffect(() => {
    const initialize = async () => {
      // Fetch settings
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          setGoogleMapsApiKey(settings.googleMapsApiKey || '')
          setMapDefaultLat(settings.mapDefaultLat || 33.3152)
          setMapDefaultLng(settings.mapDefaultLng || 44.3661)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }

      // Try to get user location for map centering
      await getUserLocation()
    }
    
    initialize()
  }, [])

  // Get the best available center coordinates for the map
  const getMapCenter = () => {
    // If user has selected a specific location, use that
    if (mapPinLat && mapPinLng) {
      return { lat: parseFloat(mapPinLat), lng: parseFloat(mapPinLng) }
    }
    
    // If we have user's current location, use that
    if (userLocationLat !== null && userLocationLng !== null) {
      return { lat: userLocationLat, lng: userLocationLng }
    }
    
    // Fall back to admin settings
    return { lat: mapDefaultLat, lng: mapDefaultLng }
  }

  const steps = [
    { 
      number: 1, 
      title: "Account Info", 
      description: "Basic account details",
      icon: User
    },
    { 
      number: 2, 
      title: "Contact Details", 
      description: "Phone and address info",
      icon: Phone
    },
    { 
      number: 3, 
      title: "Review & Create", 
      description: "Confirm your details",
      icon: Check
    }
  ]

  const getIPBasedLocation = async () => {
    try {
      // Try IP-based geolocation as fallback
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        if (data.latitude && data.longitude) {
          setMapPinLat(data.latitude.toString())
          setMapPinLng(data.longitude.toString())
          
          // Create address from IP location data
          const addressParts = []
          if (data.city) addressParts.push(data.city)
          if (data.region) addressParts.push(data.region)
          if (data.country_name) addressParts.push(data.country_name)
          
          const address = addressParts.length > 0 
            ? addressParts.join(', ') 
            : `${data.latitude}, ${data.longitude}`
          
          setAddress(address)
          return true
        }
      }
    } catch (error) {
      console.error('IP geolocation failed:', error)
    }
    return false
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.info('Geolocation is not supported by this browser. Trying IP-based location...')
      setIsLoadingLocation(true)
      const ipSuccess = await getIPBasedLocation()
      setIsLoadingLocation(false)
      if (!ipSuccess) {
        toast.error('Unable to determine your location. Please enter your address manually.')
      }
      return
    }

    setIsLoadingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Set coordinates
        setMapPinLat(latitude.toString())
        setMapPinLng(longitude.toString())
        
        try {
          // Reverse geocoding using OpenStreetMap Nominatim API (free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.display_name || `${latitude}, ${longitude}`
            setAddress(address)
          } else {
            // If reverse geocoding fails, just show coordinates
            setAddress(`${latitude}, ${longitude}`)
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error)
          setAddress(`${latitude}, ${longitude}`)
        }
        
        setIsLoadingLocation(false)
      },
      async (error) => {
        console.error('GPS geolocation failed:', error)
        let errorMessage = 'GPS location failed.'
        let tryIPFallback = false
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Trying IP-based location...'
            tryIPFallback = true
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS location unavailable. Trying IP-based location...'
            tryIPFallback = true
            break
          case error.TIMEOUT:
            errorMessage = 'GPS location timed out. Trying IP-based location...'
            tryIPFallback = true
            break
        }
        
        if (tryIPFallback) {
          // Try IP-based location as fallback
          const ipSuccess = await getIPBasedLocation()
          setIsLoadingLocation(false)
          
          if (ipSuccess) {
            toast.success('Used approximate location based on your internet connection. You can refine the address manually if needed.')
          } else {
            toast.error(errorMessage + ' Please enter your address manually.')
          }
        } else {
          setIsLoadingLocation(false)
          toast.error(errorMessage + ' Please enter your address manually.')
        }
      },
      {
        enableHighAccuracy: false, // Changed to false for better compatibility
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes cache
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      setIsLoading(false)
      return
    }

    // Debug log the data being sent
    console.log('📝 [Signup] Submitting user data:')
    console.log('   - Email:', email)
    console.log('   - Name:', name)
    console.log('   - Address:', address)
    console.log('   - Coordinates:', mapPinLat, mapPinLng)
    console.log('   - Selected Zone:', selectedZone)
    console.log('   - Zone ID:', selectedZone?.id)
    console.log('   - Location Serviceable:', locationServiceable)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          password,
          phoneNumber: phoneNumber || undefined,
          addressType: addressType || undefined,
          address: address || undefined,
          mapPinLat: mapPinLat ? parseFloat(mapPinLat) : undefined,
          mapPinLng: mapPinLng ? parseFloat(mapPinLng) : undefined,
          complexName: complexName || undefined,
          buildingNumber: buildingNumber || undefined,
          floorNumber: floorNumber || undefined,
          apartmentNumber: apartmentNumber || undefined,
          city: city || undefined,
          neighborhood: neighborhood || undefined,
          businessName: businessName || undefined,
          zoneId: selectedZone?.id || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Account created successfully! Please sign in.")
        router.push("/auth/signin")
      } else {
        toast.error(data.error || "Failed to create account")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("Sign up failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationChange = (location: {
    lat: number
    lng: number
    address: string
    zone?: DeliveryZone
    isServiceable: boolean
  }) => {
    console.log('📥 [Signup] Received location data from picker:', location)
    console.log('   - Address received:', location.address)
    console.log('   - Zone received:', location.zone?.name)

    setMapPinLat(location.lat.toString())
    setMapPinLng(location.lng.toString())
    setAddress(location.address)
    setSelectedZone(location.zone || null)
    setLocationServiceable(location.isServiceable)

    console.log('📝 [Signup] State updated:')
    console.log('   - address state set to:', location.address)
    console.log('   - selectedZone set to:', location.zone?.name)

    if (!location.isServiceable) {
      setLocationValidationError(
        "Your selected location is outside our delivery zones. Please choose a location within a highlighted zone or contact us for delivery options."
      )
    } else {
      setLocationValidationError(null)
    }
  }

  const validateStep = (step: number): string[] => {
    const errors: string[] = []

    switch (step) {
      case 1:
        if (!name.trim()) errors.push("Name is required")
        if (!email.trim()) errors.push("Email is required")
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email")
        if (password.length < 6) errors.push("Password must be at least 6 characters")
        if (password !== confirmPassword) errors.push("Passwords don't match")
        break
      case 2:
        // Check if location is provided and serviceable for delivery
        if (mapPinLat && mapPinLng && locationServiceable === false) {
          errors.push("Please select a location within our delivery zones")
        }
        break
    }

    return errors
  }

  const nextStep = () => {
    const errors = validateStep(currentStep)
    
    if (errors.length > 0) {
      setStepErrors({...stepErrors, [currentStep]: errors})
      errors.forEach(error => toast.error(error))
      return
    }
    
    setStepErrors({...stepErrors, [currentStep]: []})
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number
        
        return (
          <div key={step.number} className="flex items-center">
            <div className={`
              flex flex-col items-center space-y-2
              ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
            `}>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isActive 
                  ? 'bg-blue-600 border-blue-600 text-white scale-110' 
                  : isCompleted 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-4 transition-colors duration-300
                ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-gray-600 mt-2">Let's start with your basic information</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
        </div>
        
        <div>
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contact & Address</h2>
        <p className="text-gray-600 mt-2">Help us deliver to the right place</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number (Optional)
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="addressType" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Address Type
          </Label>
          <select
            id="addressType"
            value={addressType}
            onChange={(e) => setAddressType(e.target.value as AddressType)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="HOME">🏠 Home</option>
            <option value="BUSINESS">🏢 Business</option>
            <option value="APARTMENT">🏬 Apartment</option>
          </select>
        </div>

        {/* Location Validation Error */}
        {locationValidationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Location Not Serviceable</p>
                <p className="text-sm text-red-700 mt-1">{locationValidationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Location Picker */}
        <div>
          <Label className="text-base font-medium mb-4 block">
            Delivery Location {mapPinLat && mapPinLng ? '' : '(Optional)'}
          </Label>
          <p className="text-sm text-gray-600 mb-4">
            Select your location to see if we deliver to your area. We'll show you available delivery zones.
          </p>

          {googleMapsApiKey ? (
            <ZoneAwareLocationPicker
              apiKey={googleMapsApiKey}
              defaultCenter={{ lat: mapDefaultLat, lng: mapDefaultLng }}
              onLocationChange={handleLocationChange}
              selectedLocation={
                mapPinLat && mapPinLng && address
                  ? {
                      lat: parseFloat(mapPinLat),
                      lng: parseFloat(mapPinLng),
                      address
                    }
                  : undefined
              }
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Map Not Available</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Google Maps is not configured. You can still create an account, but location features won't be available.
                  </p>
                </div>
              </div>

              {/* Fallback manual input */}
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="address">Manual Address Entry</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your address manually"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* City and Neighborhood for HOME address type */}
        {addressType === 'HOME' && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-green-600" />
              Additional Home Details (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  type="text"
                  placeholder="Enter your neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="mt-1 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Business Name for BUSINESS address type */}
        {addressType === 'BUSINESS' && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              Business Details
            </h4>
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
          </div>
        )}

        {addressType === 'APARTMENT' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" />
              Apartment Details
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complexName">Complex Name</Label>
                  <Input
                    id="complexName"
                    type="text"
                    placeholder="Complex or building name"
                    value={complexName}
                    onChange={(e) => setComplexName(e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="buildingNumber">Building Number</Label>
                  <Input
                    id="buildingNumber"
                    type="text"
                    placeholder="Building number"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floorNumber">Floor Number</Label>
                  <Input
                    id="floorNumber"
                    type="text"
                    placeholder="Floor #"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="apartmentNumber">Apartment Number</Label>
                  <Input
                    id="apartmentNumber"
                    type="text"
                    placeholder="Apt/Unit #"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
        <p className="text-gray-600 mt-2">Please confirm your details before creating your account</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            Account Information
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {name}</p>
            <p><span className="font-medium">Email:</span> {email}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            Contact & Address
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Phone:</span> {phoneNumber || 'Not provided'}</p>
            <p><span className="font-medium">Address Type:</span> {addressType}</p>
            <p><span className="font-medium">Address:</span> {address || 'Not provided'}</p>
            {selectedZone && (
              <p><span className="font-medium">Delivery Zone:</span> {selectedZone.name}
                {selectedZone.deliveryFee && selectedZone.deliveryFee > 0 && (
                  <span className="text-blue-600 ml-1">({selectedZone.deliveryFee.toLocaleString()} IQD delivery fee)</span>
                )}
              </p>
            )}
            {addressType === 'HOME' && (city || neighborhood) && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="font-medium mb-2">Home Details:</p>
                <div className="space-y-1 text-xs">
                  {city && <p>City: {city}</p>}
                  {neighborhood && <p>Neighborhood: {neighborhood}</p>}
                </div>
              </div>
            )}
            {addressType === 'BUSINESS' && businessName && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="font-medium mb-2">Business Details:</p>
                <div className="space-y-1 text-xs">
                  <p>Business Name: {businessName}</p>
                </div>
              </div>
            )}
            {addressType === 'APARTMENT' && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="font-medium mb-2">Apartment Details:</p>
                <div className="space-y-1 text-xs">
                  {complexName && <p>Complex: {complexName}</p>}
                  {buildingNumber && <p>Building: {buildingNumber}</p>}
                  {floorNumber && <p>Floor: {floorNumber}</p>}
                  {apartmentNumber && <p>Apartment: {apartmentNumber}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepNavigation = () => (
    <div className="flex items-center justify-between pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={currentStep === 1}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      
      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={nextStep}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Create Account
            </>
          )}
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join PropaneGo</h1>
          <p className="text-gray-600">
            Create your account to start ordering propane delivery
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="p-8">
            {renderStepIndicator()}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="min-h-[400px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </div>
              
              {renderStepNavigation()}
            </form>
            
            <div className="mt-8 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}