'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface MatchingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  donationId: string
}

interface MatchingDetail {
  donation: {
    id: string
    name: string
    description: string
    quantity: number
    unit: string
    pickup_location: string
    pickup_deadline: string
    status: string
  }
  beneficiary: {
    organization_name: string
    representative_name: string
    phone: string
    address: string
  }
  match: {
    proposed_at: string
    status: string
  }
  quote?: {
    unit_price: number
    total_amount: number
    estimated_pickup_date: string
    delivery_notes: string
  }
  pickupSchedule?: {
    scheduled_date: string
    scheduled_time: string
    contact_person: string
    contact_phone: string
  }
}

export default function MatchingDetailModal({ 
  isOpen, 
  onClose, 
  donationId 
}: MatchingDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<MatchingDetail | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && donationId) {
      fetchMatchingDetails()
    }
  }, [isOpen, donationId])

  async function fetchMatchingDetails() {
    setLoading(true)
    try {
      // 기부품 정보와 매칭 정보 조회
      const { data: donation } = await supabase
        .from('donations')
        .select(`
          *,
          donation_matches!inner (
            *,
            beneficiaries!inner (
              organization_name,
              representative_name,
              phone,
              address
            )
          ),
          quotes (
            unit_price,
            total_amount,
            estimated_pickup_date,
            delivery_notes
          )
        `)
        .eq('id', donationId)
        .single()

      if (donation && donation.donation_matches?.[0]) {
        const matchData = donation.donation_matches[0]
        
        // 픽업 일정 정보가 있다면 가져오기
        const pickupSchedule = donation.status === 'pickup_scheduled' ? {
          scheduled_date: donation.pickup_deadline,
          scheduled_time: '09:00-18:00', // 기본값
          contact_person: matchData.beneficiaries.representative_name,
          contact_phone: matchData.beneficiaries.phone
        } : undefined

        setDetails({
          donation: {
            id: donation.id,
            name: donation.name || donation.description,
            description: donation.description,
            quantity: donation.quantity,
            unit: donation.unit || 'kg',
            pickup_location: donation.pickup_location,
            pickup_deadline: donation.pickup_deadline,
            status: donation.status
          },
          beneficiary: matchData.beneficiaries,
          match: {
            proposed_at: matchData.proposed_at,
            status: matchData.status
          },
          quote: donation.quotes?.[0],
          pickupSchedule
        })
      }
    } catch (error) {
      console.error('Error fetching matching details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const statusMap: { [key: string]: { text: string; color: string } } = {
    'pending_review': { text: '승인 대기', color: '#FF8C00' },
    'matched': { text: '수혜기관 선정', color: '#17A2B8' },
    'quote_sent': { text: '견적 대기', color: '#FF8C00' },
    'quote_accepted': { text: '견적 수락', color: '#007BFF' },
    'pickup_scheduled': { text: '픽업 예정', color: '#007BFF' },
    'completed': { text: '기부 완료', color: '#28A745' }
  }

  const status = details ? statusMap[details.donation.status] || { text: details.donation.status, color: '#666' } : null

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 1001,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #E9ECEF',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            fontFamily: 'Montserrat, sans-serif',
            margin: 0
          }}>
            매칭 상세 정보
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#6C757D',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8F9FA'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ color: '#6C757D' }}>로딩 중...</div>
          </div>
        ) : details ? (
          <div style={{ padding: '24px' }}>
            {/* 상태 표시 */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <span style={{
                display: 'inline-block',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: status?.color,
                backgroundColor: status?.color + '20',
                borderRadius: '20px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                {status?.text}
              </span>
            </div>

            {/* 기부품 정보 */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#02391f',
                marginBottom: '16px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                📦 기부품 정보
              </h3>
              <div style={{
                backgroundColor: '#F8F9FA',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>품명:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.donation.name}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>수량:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.donation.quantity} {details.donation.unit}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>픽업 장소:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.donation.pickup_location}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>희망 픽업일:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {new Date(details.donation.pickup_deadline).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            {/* 수혜기관 정보 */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#02391f',
                marginBottom: '16px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                🏢 수혜기관 정보
              </h3>
              <div style={{
                backgroundColor: '#F8F9FA',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>기관명:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.beneficiary.organization_name}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>담당자:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.beneficiary.representative_name}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>연락처:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.beneficiary.phone}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6C757D', fontSize: '14px' }}>주소:</span>
                  <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {details.beneficiary.address}
                  </span>
                </div>
              </div>
            </div>

            {/* 픽업 일정 (있는 경우) */}
            {details.pickupSchedule && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#02391f',
                  marginBottom: '16px',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  📅 픽업 일정
                </h3>
                <div style={{
                  backgroundColor: '#ffd02020',
                  borderLeft: '4px solid #ffd020',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>픽업 예정일:</span>
                    <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: '600', color: '#02391f' }}>
                      {new Date(details.pickupSchedule.scheduled_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>픽업 시간:</span>
                    <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {details.pickupSchedule.scheduled_time}
                    </span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>담당자:</span>
                    <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {details.pickupSchedule.contact_person}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>연락처:</span>
                    <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {details.pickupSchedule.contact_phone}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 견적 정보 (있는 경우) */}
            {details.quote && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#02391f',
                  marginBottom: '16px',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  💰 견적 정보
                </h3>
                <div style={{
                  backgroundColor: '#F8F9FA',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>단가:</span>
                    <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {details.quote.unit_price.toLocaleString()}원
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6C757D', fontSize: '14px' }}>총액:</span>
                    <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: '600', color: '#02391f' }}>
                      {details.quote.total_amount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ color: '#DC3545' }}>데이터를 불러올 수 없습니다.</div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #E9ECEF',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#FFFFFF',
              backgroundColor: '#6C757D',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Montserrat, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </>
  )
}