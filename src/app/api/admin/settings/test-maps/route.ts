import { NextRequest, NextResponse } from "next/server"

// POST /api/admin/settings/test-maps - Test Google Maps API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    // Test the API key by making a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Baghdad,Iraq&key=${apiKey}`
    
    const response = await fetch(testUrl)
    const data = await response.json()

    if (response.ok && data.status === 'OK' && data.results.length > 0) {
      return NextResponse.json({ 
        message: "API key is valid",
        valid: true,
        testLocation: data.results[0].formatted_address
      })
    } else {
      const errorMessage = data.error_message || data.status || 'Invalid API key'
      return NextResponse.json(
        { error: `Google Maps API error: ${errorMessage}`, valid: false },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error testing API key:", error)
    return NextResponse.json(
      { error: "Failed to test API key" },
      { status: 500 }
    )
  }
}