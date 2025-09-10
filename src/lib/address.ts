// Helper functions for address formatting

export interface AddressData {
  address?: string | null
  addressType?: string | null
  complexName?: string | null
  buildingNumber?: string | null
  floorNumber?: string | null
  apartmentNumber?: string | null
}

// Format address for delivery purposes (without modifying database)
export function formatDeliveryAddress(addressData: AddressData): string {
  if (!addressData.address) return ''
  
  let formattedAddress = addressData.address
  
  if (addressData.addressType === 'APARTMENT') {
    const addressParts = [addressData.address]
    
    if (addressData.complexName) addressParts.push(addressData.complexName)
    if (addressData.buildingNumber) addressParts.push(`Building ${addressData.buildingNumber}`)
    if (addressData.floorNumber) addressParts.push(`Floor ${addressData.floorNumber}`)
    if (addressData.apartmentNumber) addressParts.push(`Apt ${addressData.apartmentNumber}`)
    
    formattedAddress = addressParts.join(', ')
  }
  
  return formattedAddress
}

// Clean address data for database storage
export function cleanAddressData(data: any) {
  return {
    address: data.address?.trim() || null,
    addressType: data.addressType || null,
    complexName: data.complexName?.trim() || null,
    buildingNumber: data.buildingNumber?.trim() || null,
    floorNumber: data.floorNumber?.trim() || null,
    apartmentNumber: data.apartmentNumber?.trim() || null,
    mapPinLat: data.mapPinLat !== undefined && data.mapPinLat !== null && data.mapPinLat !== '' ? parseFloat(data.mapPinLat) : null,
    mapPinLng: data.mapPinLng !== undefined && data.mapPinLng !== null && data.mapPinLng !== '' ? parseFloat(data.mapPinLng) : null
  }
}