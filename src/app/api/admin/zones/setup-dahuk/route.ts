import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/admin/zones/setup-dahuk - Setup predefined Dahuk city zones
export async function POST() {
  try {
    // Check if zones already exist
    const existingZones = await prisma.deliveryZone.count()
    
    if (existingZones > 0) {
      return NextResponse.json(
        { error: "Delivery zones already exist. Delete existing zones first." },
        { status: 400 }
      )
    }

    // Dahuk city zones with precise coordinates
    const dahukZones = [
      {
        name: "Central Dahuk",
        color: "#3B82F6", // Blue
        description: "City center and main commercial area",
        deliveryFee: 15000,
        coordinates: [
          {lat: 36.8672, lng: 42.9976},
          {lat: 36.8672, lng: 43.0176}, 
          {lat: 36.8472, lng: 43.0176},
          {lat: 36.8472, lng: 42.9976}
        ]
      },
      {
        name: "Northern Districts", 
        color: "#10B981", // Green
        description: "Residential areas north of center",
        deliveryFee: 18000,
        coordinates: [
          {lat: 36.8772, lng: 42.9976},
          {lat: 36.8772, lng: 43.0176},
          {lat: 36.8672, lng: 43.0176},
          {lat: 36.8672, lng: 42.9976}
        ]
      },
      {
        name: "Southern Districts",
        color: "#F59E0B", // Orange
        description: "Southern residential and industrial areas", 
        deliveryFee: 18000,
        coordinates: [
          {lat: 36.8472, lng: 42.9976},
          {lat: 36.8472, lng: 43.0176},
          {lat: 36.8272, lng: 43.0176},
          {lat: 36.8272, lng: 42.9976}
        ]
      },
      {
        name: "Eastern Suburbs",
        color: "#8B5CF6", // Purple
        description: "Eastern expansion areas",
        deliveryFee: 22500,
        coordinates: [
          {lat: 36.8672, lng: 43.0176},
          {lat: 36.8672, lng: 43.0376},
          {lat: 36.8472, lng: 43.0376},
          {lat: 36.8472, lng: 43.0176}
        ]
      },
      {
        name: "Western Outskirts",
        color: "#EF4444", // Red
        description: "Western rural and suburban areas",
        deliveryFee: 25000,
        coordinates: [
          {lat: 36.8672, lng: 42.9776},
          {lat: 36.8672, lng: 42.9976},
          {lat: 36.8472, lng: 42.9976},
          {lat: 36.8472, lng: 42.9776}
        ]
      }
    ]

    // Create all zones
    const createdZones = await prisma.$transaction(
      dahukZones.map(zone =>
        prisma.deliveryZone.create({
          data: {
            name: zone.name,
            color: zone.color,
            coordinates: zone.coordinates,
            deliveryFee: zone.deliveryFee,
            description: zone.description,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json({ 
      message: "Dahuk zones created successfully",
      zones: createdZones 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating Dahuk zones:", error)
    return NextResponse.json(
      { error: "Failed to create Dahuk zones" },
      { status: 500 }
    )
  }
}