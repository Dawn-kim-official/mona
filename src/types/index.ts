export interface Business {
  id: string
  name: string
  representativeName: string
  businessLicense: string
  email: string
  phone: string
  address: string
  website?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export interface Donation {
  id: string
  businessId: string
  description: string
  photos: string[]
  expirationDate?: Date
  quantity: number
  pickupDeadline: Date
  pickupLocation: string
  taxDeductionNeeded: boolean
  status: 'pending_review' | 'quote_sent' | 'quote_accepted' | 'matched' | 'pickup_scheduled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface Quote {
  id: string
  donationId: string
  amount: number
  paymentTerms: string
  status: 'sent' | 'accepted' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  role: 'business' | 'admin'
  businessId?: string
  createdAt: Date
  updatedAt: Date
}