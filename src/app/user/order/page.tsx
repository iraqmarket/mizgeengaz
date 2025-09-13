'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  MapPin, 
  Phone, 
  CreditCard, 
  User, 
  Loader2,
  Navigation,
  ShoppingCart,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TankPrice {
  id: string
  type: string
  basePrice: number
  deliveryFee: number
  isActive: boolean
}

export default function PlaceOrder() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedType, setSelectedType] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [tankPrices, setTankPrices] = useState<TankPrice[]>([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userZone, setUserZone] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  const selectedTank = tankPrices.find(tank => tank.type === selectedType)
  const totalPrice = selectedTank ? (selectedTank.basePrice + selectedTank.deliveryFee) * quantity : 0

  // Fetch tank prices
  const fetchPrices = async () => {
    try {
      setLoadingPrices(true)
      const response = await fetch('/api/admin/prices')
      if (response.ok) {
        const data = await response.json()
        const activePrices = data.prices.filter((price: TankPrice) => price.isActive)
        setTankPrices(activePrices)
        
        // Auto-select first available tank type
        if (activePrices.length > 0 && !selectedType) {
          setSelectedType(activePrices[0].type)
        }
      } else {
        toast.error('Failed to load pricing information')
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
      toast.error('Failed to load pricing information')
    } finally {
      setLoadingPrices(false)
    }
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!session?.user) return
    
    setIsLoadingProfile(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setDeliveryAddress(data.user.address || '')
          setPhoneNumber(data.user.phoneNumber || '')
          setUserZone(data.user.zone)

          // Set user location from coordinates
          if (data.user.mapPinLat && data.user.mapPinLng) {
            setUserLocation({
              lat: data.user.mapPinLat,
              lng: data.user.mapPinLng
            })
          }

          console.log('🏠 [Order] User profile loaded:')
          console.log('   - Address:', data.user.address)
          console.log('   - Zone:', data.user.zone)
          console.log('   - Coordinates:', data.user.mapPinLat, data.user.mapPinLng)

          // Check if address is just the zone name and suggest alternatives
          if (data.user.zone && data.user.address === data.user.zone.name) {
            console.log('⚠️ [Order] Address is same as zone name - this needs user correction')

            // Add a helpful message in the address field
            if (data.user.city || data.user.neighborhood) {
              const suggestedAddress = [data.user.neighborhood, data.user.city].filter(Boolean).join(', ')
              console.log('💡 [Order] Suggesting address based on city/neighborhood:', suggestedAddress)
              setDeliveryAddress(suggestedAddress)
            }
          }

          if (data.user.address && data.user.phoneNumber) {
            toast.success('Your delivery info has been loaded from your profile!')
          }
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  useEffect(() => {
    fetchUserProfile()
  }, [session])

  const handleOrderSubmit = async () => {
    if (!selectedTank) {
      toast.error('Please select a tank type')
      return
    }
    
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address')
      return
    }
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tankType: selectedTank.type,
          quantity,
          deliveryAddress,
          phoneNumber
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Order submitted successfully! Order ID: ${result.order.id}`)
        
        // Redirect to order history
        router.push('/user/orders')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to submit order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Place New Order</h1>
        <p className="text-gray-600 mt-2">
          Order your propane tank with fast, reliable delivery
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tank Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Select Tank Type
              </CardTitle>
              <CardDescription>
                Choose from our available tank options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-3 text-gray-600">Loading available tanks...</span>
                </div>
              ) : tankPrices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tanks are currently available for delivery.</p>
                  <p className="text-sm">Please check back later.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {tankPrices.map((tank) => (
                    <div
                      key={tank.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedType === tank.type
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedType(tank.type)}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">{tank.type}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Base: {tank.basePrice.toLocaleString()} IQD
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Delivery: {tank.deliveryFee.toLocaleString()} IQD
                        </div>
                        <div className="text-xl font-semibold text-green-600">
                          {(tank.basePrice + tank.deliveryFee).toLocaleString()} IQD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantity Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
                <span className="text-sm text-gray-600 ml-4">
                  {quantity} tank{quantity > 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone Information */}
              {userZone && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: userZone.color }}
                    />
                    <span className="text-sm font-medium text-green-800">
                      Delivery Zone: {userZone.name}
                    </span>
                  </div>
                  {userZone.deliveryFee && userZone.deliveryFee > 0 && (
                    <p className="text-xs text-green-700">
                      Zone delivery fee: {userZone.deliveryFee.toLocaleString()} IQD
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="address"
                    placeholder="Enter your delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="flex-1"
                    disabled={isLoadingProfile}
                  />
                  <Button variant="outline" size="sm" disabled={isLoadingProfile}>
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>

                {/* Address correction notice */}
                {(deliveryAddress && userZone && deliveryAddress.includes(userZone.name)) && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-amber-800">
                          <strong>⚠️ Address Notice:</strong> Your address is showing the zone name "{userZone.name}" instead of your street address.
                          Please edit the field above to enter your actual street address.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeliveryAddress('')}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100"
                      >
                        Clear & Fix
                      </Button>
                    </div>
                  </div>
                )}

                {userLocation && (
                  <div className="mt-1 text-xs text-gray-500">
                    <span>📍 Precise coordinates: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</span>
                    {userZone && (
                      <span className="ml-2">• Zone: {userZone.name}</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  placeholder="+964 (770) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoadingProfile}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTank ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tank Type:</span>
                      <span className="font-medium">{selectedTank.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{(selectedTank.basePrice * quantity).toLocaleString()} IQD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span>{(selectedTank.deliveryFee * quantity).toLocaleString()} IQD</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{totalPrice.toLocaleString()} IQD</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 py-3"
                    onClick={handleOrderSubmit}
                    disabled={loadingPrices || isLoadingProfile || !deliveryAddress.trim() || !phoneNumber.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Place Order - {totalPrice.toLocaleString()} IQD
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Select a tank type to continue</p>
                </div>
              )}
              
              {(!deliveryAddress.trim() || !phoneNumber.trim()) && (
                <p className="text-sm text-orange-600 text-center">
                  Please fill in your delivery address and phone number
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Same-day delivery available</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Safe & Certified</h3>
              <p className="text-sm text-gray-600">All tanks inspected & certified</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Reliable Service</h3>
              <p className="text-sm text-gray-600">Professional drivers & tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}