'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  Key, 
  Map, 
  Save, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield
} from "lucide-react"
import { toast } from "sonner"

interface AppSettings {
  id?: string
  googleMapsApiKey?: string
  mapDefaultLat?: number
  mapDefaultLng?: number
  deliveryRadius?: number
  createdAt?: string
  updatedAt?: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    mapDefaultLat: 33.3152, // Baghdad default
    mapDefaultLng: 44.3661,
    deliveryRadius: 25 // 25km default radius
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingMaps, setTestingMaps] = useState(false)

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings(data.settings)
          }
        } else {
          // Settings don't exist yet, use defaults
          console.log('No settings found, using defaults')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!settings.googleMapsApiKey?.trim()) {
      toast.error('Please enter a Google Maps API key')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
        const data = await response.json()
        setSettings(data.settings)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const testGoogleMapsApi = async () => {
    if (!settings.googleMapsApiKey?.trim()) {
      toast.error('Please enter a Google Maps API key first')
      return
    }

    try {
      setTestingMaps(true)
      const response = await fetch('/api/admin/settings/test-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: settings.googleMapsApiKey }),
      })

      if (response.ok) {
        toast.success('Google Maps API key is valid!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Invalid Google Maps API key')
      }
    } catch (error) {
      console.error('Error testing API key:', error)
      toast.error('Failed to test API key')
    } finally {
      setTestingMaps(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your PropaneGo system settings and integrations
        </p>
      </div>

      {/* Google Maps Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            Google Maps Integration
          </CardTitle>
          <CardDescription>
            Configure Google Maps API for location services and driver tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Google Maps API Key *
            </Label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={settings.googleMapsApiKey || ''}
                  onChange={(e) => setSettings({...settings, googleMapsApiKey: e.target.value})}
                  placeholder="Enter your Google Maps API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={testGoogleMapsApi}
                disabled={testingMaps || !settings.googleMapsApiKey?.trim()}
              >
                {testingMaps ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-600">
                Need an API key? 
                <a 
                  href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 ml-1 inline-flex items-center gap-1"
                >
                  Get one from Google Cloud Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Make sure to enable Maps JavaScript API and Geocoding API
              </p>
            </div>
          </div>

          {/* Map Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mapDefaultLat">Default Map Center - Latitude</Label>
              <Input
                id="mapDefaultLat"
                type="number"
                step="any"
                value={settings.mapDefaultLat || ''}
                onChange={(e) => setSettings({...settings, mapDefaultLat: parseFloat(e.target.value)})}
                placeholder="33.3152 (Baghdad)"
              />
            </div>
            <div>
              <Label htmlFor="mapDefaultLng">Default Map Center - Longitude</Label>
              <Input
                id="mapDefaultLng"
                type="number"
                step="any"
                value={settings.mapDefaultLng || ''}
                onChange={(e) => setSettings({...settings, mapDefaultLng: parseFloat(e.target.value)})}
                placeholder="44.3661 (Baghdad)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
            <Input
              id="deliveryRadius"
              type="number"
              value={settings.deliveryRadius || ''}
              onChange={(e) => setSettings({...settings, deliveryRadius: parseInt(e.target.value)})}
              placeholder="25"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum distance for deliveries from driver location
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSaveSettings}
              disabled={saving || !settings.googleMapsApiKey?.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage API security and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">API Key Security</p>
                <p className="text-sm text-green-700">
                  Your API keys are encrypted and stored securely. Never share them publicly.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                <strong>Domain restrictions:</strong> Configure your API key to only work from your domain
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                <strong>Usage monitoring:</strong> Monitor your API usage in Google Cloud Console
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                <strong>Rate limits:</strong> Set appropriate rate limits to prevent abuse
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Features Preview */}
      {settings.googleMapsApiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-purple-600" />
              Map Features Available
            </CardTitle>
            <CardDescription>
              Features enabled with Google Maps integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Driver Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time location tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Route optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Delivery radius visualization</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Admin Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Driver location monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Delivery area analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Order delivery tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}