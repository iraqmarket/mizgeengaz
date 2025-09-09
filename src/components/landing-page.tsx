'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signIn, signOut } from "next-auth/react"
import { Truck, Clock, Shield, Star, MapPin, Phone, CreditCard, User, Loader2, Package } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface TankPrice {
  id: string
  type: string
  basePrice: number
  deliveryFee: number
  isActive: boolean
  totalPrice?: number
}

export function LandingPage() {
  const { data: session } = useSession()
  const [selectedType, setSelectedType] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false)
  const [tankPrices, setTankPrices] = useState<TankPrice[]>([])
  const [loadingPrices, setLoadingPrices] = useState(true)

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

  // Fetch prices on component mount
  useEffect(() => {
    fetchPrices()
  }, [])

  // Fetch user profile data when session is available
  useEffect(() => {
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
            setHasCompleteProfile(data.user.hasCompleteProfile)
            
            if (data.user.hasCompleteProfile) {
              toast.success('Your delivery info has been loaded from your profile!')
            } else if (data.user.address || data.user.phoneNumber) {
              toast.info('Some profile info loaded. You can complete missing details below.')
            }
          }
        } else {
          console.error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

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
        
        // Reset form
        setQuantity(1)
        // Keep selected tank and address for convenience
        
        // Could redirect to order confirmation page
        // router.push(`/orders/${result.order.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to submit order')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome to PropaneGo</CardTitle>
              <CardDescription>
                Sign in to order your propane delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => signIn()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">PropaneGo</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {session.user?.name}</span>
            <Link href="/user">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Fast Propane Delivery
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get your propane tank delivered to your door in under 2 hours. Safe, reliable, and hassle-free.
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col items-center p-6">
              <Clock className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Same-day delivery available</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Safe & Certified</h3>
              <p className="text-gray-600">All tanks inspected & certified</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <Star className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">5-Star Service</h3>
              <p className="text-gray-600">Rated #1 by customers</p>
            </div>
          </div>
        </div>

        {/* Order Section */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Order Your Propane Tank</CardTitle>
              <CardDescription>
                Select your tank size and quantity, then schedule delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tank Selection */}
              <div>
                <Label className="text-base font-medium mb-4 block">Select Tank Type</Label>
                {loadingPrices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading available tanks...</span>
                  </div>
                ) : tankPrices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tanks are currently available for delivery.</p>
                    <p className="text-sm">Please check back later.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tankPrices.map((tank) => (
                      <div
                        key={tank.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedType === tank.type
                            ? 'border-blue-600 bg-blue-50'
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
                          <div className="text-xl font-semibold text-blue-600">
                            {(tank.basePrice + tank.deliveryFee).toLocaleString()} IQD
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity" className="text-base font-medium">Quantity</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
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
                </div>
              </div>

              {/* Profile Status Indicator */}
              {session && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {isLoadingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-800">Loading your profile...</span>
                      </>
                    ) : hasCompleteProfile ? (
                      <>
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Profile information loaded automatically</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-800">Complete your profile info below</span>
                      </>
                    )}
                  </div>
                  {!isLoadingProfile && !hasCompleteProfile && (
                    <p className="text-xs text-blue-700">
                      Your address and phone will be saved to your profile for faster checkout next time.
                    </p>
                  )}
                </div>
              )}

              {/* Delivery Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="address" className="text-base font-medium">
                    Delivery Address
                    {hasCompleteProfile && (
                      <span className="text-xs text-green-600 ml-2">(from profile)</span>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="address"
                      placeholder="Enter your address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="flex-1"
                      disabled={isLoadingProfile}
                    />
                    <Button variant="outline" size="sm" disabled={isLoadingProfile}>
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone Number
                    {hasCompleteProfile && (
                      <span className="text-xs text-green-600 ml-2">(from profile)</span>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="phone"
                      placeholder="+964 (770) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                      disabled={isLoadingProfile}
                    />
                    <Button variant="outline" size="sm" disabled={isLoadingProfile}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">Order Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalPrice.toLocaleString()} IQD
                  </span>
                </div>
                {selectedTank && (
                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span>{quantity}x {selectedTank.type}</span>
                      <span>{(selectedTank.basePrice * quantity).toLocaleString()} IQD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{(selectedTank.deliveryFee * quantity).toLocaleString()} IQD</span>
                    </div>
                  </div>
                )}
                
                <Link href="/user/order">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                    disabled={loadingPrices || isLoadingProfile}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {loadingPrices || isLoadingProfile ? 'Loading...' : 'Go to Order Dashboard'}
                  </Button>
                </Link>
                
                {(!deliveryAddress.trim() || !phoneNumber.trim()) && (
                  <p className="text-sm text-orange-600 text-center mt-2">
                    Please fill in your delivery address and phone number to continue
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Time Estimate */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">Estimated Delivery</div>
                    <div className="text-sm text-gray-600">Today, 2:30 PM - 4:30 PM</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Delivery Fee</div>
                  <div className="font-semibold text-blue-600">
                    {selectedTank ? `${selectedTank.deliveryFee.toLocaleString()} IQD` : 'Select tank first'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 PropaneGo. All rights reserved.</p>
            <p className="text-sm mt-2">Safe, reliable propane delivery service</p>
          </div>
        </div>
      </footer>
    </div>
  )
}