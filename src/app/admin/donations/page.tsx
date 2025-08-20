'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Donation = Database['public']['Tables']['donations']['Row'] & {
  businesses: {
    name: string
  }
}

export default function AdminDonationsPage() {
  const supabase = createClient()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDonations()
  }, [])

  async function fetchDonations() {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        businesses (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching donations:', error)
    } else {
      setDonations(data || [])
    }
    setLoading(false)
  }

  async function updateDonationStatus(donationId: string, status: string) {
    const updates: any = { status }
    
    if (status === 'pickup_scheduled') {
      updates.pickup_scheduled_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', donationId)

    if (error) {
      console.error('Error updating donation:', error)
    } else {
      fetchDonations()
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <div>
      <h2>기부 관리</h2>

      {donations.length === 0 ? (
        <p>기부가 없습니다.</p>
      ) : (
        <div>
          {donations.map((donation) => (
            <div key={donation.id}>
              <h3>{donation.businesses?.name} - {donation.description}</h3>
              <p>수량: {donation.quantity}</p>
              <p>픽업 장소: {donation.pickup_location}</p>
              <p>픽업 마감일: {new Date(donation.pickup_deadline).toLocaleDateString()}</p>
              <p>세금 공제: {donation.tax_deduction_needed ? '필요' : '불필요'}</p>
              <p>상태: {donation.status}</p>

              {donation.photos && donation.photos.length > 0 && (
                <div>
                  <p>사진:</p>
                  {donation.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`기부 사진 ${index + 1}`} width={200} />
                  ))}
                </div>
              )}

              <div>
                {donation.status === 'pending_review' && (
                  <button onClick={() => updateDonationStatus(donation.id, 'matched')}>
                    매칭 완료
                  </button>
                )}
                {donation.status === 'quote_accepted' && (
                  <button onClick={() => updateDonationStatus(donation.id, 'pickup_scheduled')}>
                    픽업 예정
                  </button>
                )}
                {donation.status === 'pickup_scheduled' && (
                  <button onClick={() => updateDonationStatus(donation.id, 'completed')}>
                    완료
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}