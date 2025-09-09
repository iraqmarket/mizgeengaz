'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Package,
  Truck,
  ToggleLeft,
  ToggleRight,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface Price {
  id: string
  type: string
  basePrice: number
  deliveryFee: number
  isActive: boolean
  totalPrice: number
  createdAt: string
  updatedAt: string
}

interface TankPrice {
  id: string
  type: string
  basePrice: number
  deliveryFee: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PricesPage() {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: '',
    basePrice: '',
    deliveryFee: ''
  })

  // Fetch prices from API
  const fetchPrices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/prices')
      if (response.ok) {
        const data = await response.json()
        setPrices(data.prices.map((price: TankPrice) => ({
          ...price,
          totalPrice: price.basePrice + price.deliveryFee
        })))
      } else {
        toast.error('Failed to fetch prices')
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
      toast.error('Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  const handleAddPrice = async () => {
    if (!formData.type || !formData.basePrice || !formData.deliveryFee) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          basePrice: parseFloat(formData.basePrice),
          deliveryFee: parseFloat(formData.deliveryFee),
          isActive: true
        }),
      })

      if (response.ok) {
        toast.success('Price added successfully')
        setFormData({ type: '', basePrice: '', deliveryFee: '' })
        setShowAddPrice(false)
        fetchPrices() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add price')
      }
    } catch (error) {
      console.error('Error adding price:', error)
      toast.error('Failed to add price')
    }
  }

  const handleEditPrice = (price: Price) => {
    setEditingId(price.id)
    setFormData({
      type: price.type,
      basePrice: price.basePrice.toString(),
      deliveryFee: price.deliveryFee.toString()
    })
  }

  const handleSaveEdit = async () => {
    if (!formData.type || !formData.basePrice || !formData.deliveryFee || !editingId) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch(`/api/admin/prices/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          basePrice: parseFloat(formData.basePrice),
          deliveryFee: parseFloat(formData.deliveryFee)
        }),
      })

      if (response.ok) {
        toast.success('Price updated successfully')
        setEditingId(null)
        setFormData({ type: '', basePrice: '', deliveryFee: '' })
        fetchPrices() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update price')
      }
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Failed to update price')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ type: '', basePrice: '', deliveryFee: '' })
  }

  const handleToggleActive = async (id: string) => {
    const price = prices.find(p => p.id === id)
    if (!price) return

    try {
      const response = await fetch(`/api/admin/prices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !price.isActive
        }),
      })

      if (response.ok) {
        toast.success(`Price ${!price.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchPrices() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update price status')
      }
    } catch (error) {
      console.error('Error updating price status:', error)
      toast.error('Failed to update price status')
    }
  }

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/prices/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Price deleted successfully')
        fetchPrices() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete price')
      }
    } catch (error) {
      console.error('Error deleting price:', error)
      toast.error('Failed to delete price')
    }
  }

  const AddPriceForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Price</CardTitle>
        <CardDescription>Set pricing for a new tank type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="type">Tank Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select tank type</option>
              <option value="Old Tank">Old Tank</option>
              <option value="New Tank">New Tank</option>
              <option value="Old Tank (Large)">Old Tank (Large)</option>
              <option value="New Tank (Large)">New Tank (Large)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="basePrice">Base Price (IQD)</Label>
            <Input
              id="basePrice"
              type="number"
              step="500"
              placeholder="37500"
              value={formData.basePrice}
              onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="deliveryFee">Delivery Fee (IQD)</Label>
            <Input
              id="deliveryFee"
              type="number"
              step="500"
              placeholder="15000"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({...formData, deliveryFee: e.target.value})}
            />
          </div>
        </div>
        
        {formData.basePrice && formData.deliveryFee && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Total Price: {(parseFloat(formData.basePrice || '0') + parseFloat(formData.deliveryFee || '0')).toLocaleString()} IQD</strong>
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleAddPrice} className="bg-blue-600 hover:bg-blue-700">
            Add Price
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowAddPrice(false)
              setFormData({ type: '', basePrice: '', deliveryFee: '' })
            }}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing</h1>
          <p className="text-gray-600 mt-2">
            Manage your propane tank pricing and delivery fees
          </p>
        </div>
        <Button 
          onClick={() => setShowAddPrice(!showAddPrice)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Price
        </Button>
      </div>

      {showAddPrice && <AddPriceForm />}

      {/* Pricing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Prices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    prices.filter(p => p.isActive).length
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Delivery Fee</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : prices.length > 0 ? (
                    `${Math.round(prices.reduce((sum, p) => sum + p.deliveryFee, 0) / prices.length).toLocaleString()} IQD`
                  ) : (
                    '0 IQD'
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Price Range</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : prices.length > 0 ? (
                    `${Math.min(...prices.map(p => p.totalPrice)).toLocaleString()} - ${Math.max(...prices.map(p => p.totalPrice)).toLocaleString()} IQD`
                  ) : (
                    '0 - 0 IQD'
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Pricing</CardTitle>
          <CardDescription>
            All pricing tiers for your propane tanks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading prices...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Base Price</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Delivery Fee</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Total Price</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Last Updated</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((price) => (
                  <tr key={price.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      {editingId === price.id ? (
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                          <option value="">Select type</option>
                          <option value="Old Tank">Old Tank</option>
                          <option value="New Tank">New Tank</option>
                          <option value="Old Tank (Large)">Old Tank (Large)</option>
                          <option value="New Tank (Large)">New Tank (Large)</option>
                        </select>
                      ) : (
                        <span className="font-medium text-gray-900">{price.type}</span>
                      )}
                    </td>
                    <td className="py-4">
                      {editingId === price.id ? (
                        <Input
                          type="number"
                          step="500"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                          className="w-24"
                        />
                      ) : (
                        <span className="text-gray-700">{price.basePrice.toLocaleString()} IQD</span>
                      )}
                    </td>
                    <td className="py-4">
                      {editingId === price.id ? (
                        <Input
                          type="number"
                          step="500"
                          value={formData.deliveryFee}
                          onChange={(e) => setFormData({...formData, deliveryFee: e.target.value})}
                          className="w-24"
                        />
                      ) : (
                        <span className="text-gray-700">{price.deliveryFee.toLocaleString()} IQD</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="font-semibold text-gray-900">
                        {editingId === price.id 
                          ? (parseFloat(formData.basePrice || '0') + parseFloat(formData.deliveryFee || '0')).toLocaleString()
                          : price.totalPrice.toLocaleString()
                        } IQD
                      </span>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleToggleActive(price.id)}
                        className="flex items-center gap-2"
                      >
                        {price.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {new Date(price.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {editingId === price.id ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditPrice(price)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeletePrice(price.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && prices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prices configured</h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first pricing tier
            </p>
            <Button 
              onClick={() => setShowAddPrice(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Price
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}