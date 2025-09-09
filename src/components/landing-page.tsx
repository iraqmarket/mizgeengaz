'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signIn, signOut } from "next-auth/react"
import { Truck, Clock, Shield, Star, MapPin, Phone, CreditCard } from "lucide-react"

export function LandingPage() {
  const { data: session } = useSession()
  const [selectedSize, setSelectedSize] = useState("20lb")
  const [quantity, setQuantity] = useState(1)

  const tankSizes = [
    { size: "20lb", price: 24.99, description: "Standard BBQ tank" },
    { size: "30lb", price: 34.99, description: "Large BBQ tank" },
    { size: "40lb", price: 44.99, description: "RV/Forklift tank" },
    { size: "100lb", price: 89.99, description: "Commercial tank" }
  ]

  const selectedTank = tankSizes.find(tank => tank.size === selectedSize)
  const totalPrice = selectedTank ? selectedTank.price * quantity : 0

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
                <Label className="text-base font-medium mb-4 block">Select Tank Size</Label>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tankSizes.map((tank) => (
                    <div
                      key={tank.size}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSize === tank.size
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSize(tank.size)}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">{tank.size}</div>
                        <div className="text-sm text-gray-600 mb-2">{tank.description}</div>
                        <div className="text-xl font-semibold text-blue-600">
                          ${tank.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

              {/* Delivery Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="address" className="text-base font-medium">Delivery Address</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="address"
                      placeholder="Enter your address"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
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
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  {quantity}x {selectedSize} Tank{quantity > 1 ? 's' : ''} 
                  {selectedTank && ` (${selectedTank.description})`}
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Schedule Delivery - ${totalPrice.toFixed(2)}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Time Estimate */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-semibold">Estimated Delivery</div>
                    <div className="text-sm text-gray-600">Today, 2:30 PM - 4:30 PM</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Delivery Fee</div>
                  <div className="font-semibold text-green-600">FREE</div>
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