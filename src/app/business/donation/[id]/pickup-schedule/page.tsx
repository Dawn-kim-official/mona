'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Donation = Database['public']['Tables']['donations']['Row']
type Quote = Database['public']['Tables']['quotes']['Row']

export default function PickupSchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [donation, setDonation] = useState<Donation | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('14:00')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDonationAndQuote()
  }, [params.id])

  async function fetchDonationAndQuote() {
    const { data: donationData, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (donationError || !donationData) {
      console.error('Error fetching donation:', donationError)
      router.push('/business/dashboard')
      return
    }

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('donation_id', params.id)
      .eq('status', 'accepted')
      .single()

    if (quoteError || !quoteData) {
      console.error('Error fetching quote:', quoteError)
      router.push('/business/dashboard')
      return
    }

    setDonation(donationData)
    setQuote(quoteData)
    setSelectedDate(quoteData.pickup_date.split('T')[0])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Update the quote with confirmed pickup details
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          pickup_date: `${selectedDate}T${selectedTime}:00`,
          pickup_notes: notes,
          status: 'confirmed'
        })
        .eq('id', quote!.id)

      if (quoteError) throw quoteError

      // Update donation status
      const { error: donationError } = await supabase
        .from('donations')
        .update({
          status: 'pickup_scheduled',
          scheduled_pickup_date: `${selectedDate}T${selectedTime}:00`
        })
        .eq('id', params.id)

      if (donationError) throw donationError

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: donation!.business_id,
          type: 'pickup_scheduled',
          title: '픽업 일정이 확정되었습니다',
          message: `${selectedDate} ${selectedTime}에 픽업이 예정되어 있습니다.`,
          related_donation_id: params.id
        })

      router.push('/business/dashboard')
    } catch (error) {
      console.error('Error scheduling pickup:', error)
      alert('픽업 일정 확정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (!donation || !quote) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>정보를 불러올 수 없습니다.</div>
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
    outline: 'none'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#212529'
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#fafafa', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1B4D3E' }}>픽업 일정 조율</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>견적이 수락되었습니다. 픽업 일정을 확정해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: 'white', 
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {/* 기부 정보 */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#111827'
            }}>
              기부 정보
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>품명:</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{donation.description}</p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>수량:</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                  {donation.quantity}{donation.unit || 'kg'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>픽업 장소:</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{donation.pickup_location}</p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>견적 금액:</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                  {quote.total_amount.toLocaleString()}원
                </p>
              </div>
            </div>
          </div>

          {/* 픽업 일정 선택 */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              픽업 날짜 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
            <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px' }}>
              제안된 픽업 날짜: {new Date(quote.pickup_date).toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              픽업 시간 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            >
              <option value="09:00">오전 9:00</option>
              <option value="10:00">오전 10:00</option>
              <option value="11:00">오전 11:00</option>
              <option value="14:00">오후 2:00</option>
              <option value="15:00">오후 3:00</option>
              <option value="16:00">오후 4:00</option>
              <option value="17:00">오후 5:00</option>
            </select>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={labelStyle}>
              요청사항
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              placeholder="픽업 시 특별한 요청사항이 있으면 입력해주세요 (예: 엘리베이터 사용 불가, 주차 공간 협소 등)"
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/business/dashboard')}
              style={{
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: '500',
                color: '#666',
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
            >
              나중에 하기
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: submitting ? '#FDD676' : '#FFB800',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#F0A800';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 184, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#FFB800';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {submitting ? '확정 중...' : '픽업 일정 확정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}