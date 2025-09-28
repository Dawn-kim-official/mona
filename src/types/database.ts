// Supabase 데이터베이스 실제 구조에 맞춘 타입 정의

export interface Business {
  id: string
  user_id: string | null
  name: string
  business_license_url: string
  website: string | null
  status: string
  contract_signed: boolean
  contract_signed_at: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  esg_report_url: string | null
  business_number: string | null
  manager_name: string | null
  manager_phone: string | null
  business_type: string | null
  business_registration_number: string | null
  sns_link: string | null
  postcode: string | null
  detail_address: string | null
  address: string | null
}

export interface Donation {
  id: string
  business_id: string
  description: string
  photos: string[] | null
  expiration_date: string | null
  quantity: number
  pickup_deadline: string
  pickup_location: string
  tax_deduction_needed: boolean | null
  status: string | null
  matched_charity_name: string | null
  matched_at: string | null
  matched_by: string | null
  pickup_scheduled_at: string | null
  completed_at: string | null
  tax_document_url: string | null
  esg_report_url: string | null
  post_donation_media: string[] | null
  co2_saved: number | null
  meals_served: number | null
  waste_diverted: number | null
  created_at: string | null
  updated_at: string | null
  name: string | null
  unit: string | null
  condition: string | null
  additional_info: string | null
  category: string | null
  pickup_time: string | null
  tax_invoice_email: string | null
  business_type: string | null
  direct_delivery_available: boolean | null
  product_detail_url: string | null
}

export interface Beneficiary {
  id: string
  user_id: string | null
  organization_name: string
  representative_name: string
  phone: string
  address: string
  postcode: string | null
  detail_address: string | null
  website: string | null
  sns_link: string | null
  tax_exempt_cert_url: string | null
  email: string | null
  desired_items: string | null
  beneficiary_types: string[] | null
  can_pickup: boolean | null
  can_issue_receipt: boolean | null
  additional_request: string | null
  contract_signed: boolean | null
  created_at: string
  updated_at: string
}

export interface DonationMatch {
  id: string
  donation_id: string
  beneficiary_id: string
  status: string
  accepted_quantity: number | null
  accepted_unit: string | null
  remaining_quantity: number | null
  created_at: string
  updated_at: string | null
  quote_sent_at: string | null
  received_at: string | null
  receipt_file_url: string | null
}

export interface Quote {
  id: string
  donation_match_id: string
  delivery_fee: number
  pickup_date: string | null
  pickup_time: string | null
  payment_terms: string | null
  status: string
  created_at: string
  updated_at: string
}