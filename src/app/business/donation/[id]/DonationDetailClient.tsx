'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import QuoteDetailModal from '@/components/QuoteDetailModal'

interface Donation {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  pickup_deadline: string
  pickup_location: string
  status: string
  photos: string[]
  created_at: string
  additional_info?: string
  donation_matches?: any[]
}

interface Quote {
  id: string
  unit_price: number
  logistics_cost: number
  total_amount: number
  estimated_pickup_date: string
  special_notes?: string
  status: string
  created_at?: string
}

const statusSteps = [
  { key: 'pending_review', label: '등록', icon: '1' },
  { key: 'quote_sent', label: '견적 발송', icon: '2' },
  { key: 'quote_accepted', label: '견적 확인', icon: '3' },
  { key: 'pickup_scheduled', label: '일정 조율', icon: '4' },
  { key: 'completed', label: '픽업 완료', icon: '5' }
]

interface DonationDetailClientProps {
  donationId: string
  initialDonation: any
  initialMatches: any[]
}

export default function DonationDetailClient({ donationId, initialDonation, initialMatches }: DonationDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [donation, setDonation] = useState<Donation | null>(initialDonation)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [donationMatches, setDonationMatches] = useState<any[]>(initialMatches)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pickupSchedule, setPickupSchedule] = useState<any>(null)

  useEffect(() => {
    // Use initial data if available
    if (initialDonation) {
      setDonation(initialDonation)
      setDonationMatches(initialMatches)
      fetchAdditionalData()
    } else {
      // Fallback to client-side fetch if no initial data
      fetchDonationDetail()
    }
  }, [donationId])

  async function fetchAdditionalData() {
    if (!donationId || !initialDonation) return

    try {
      // Fetch quote if exists (최신 견적서 가져오기)
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('donation_id', donationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (quoteData) {
        console.log('Quote data:', quoteData)
        setQuote(quoteData)
      }
      
      // Fetch pickup schedule if status is pickup_scheduled or pickup_coordinating
      if (initialDonation.status === 'pickup_scheduled' || initialDonation.status === 'pickup_coordinating') {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('pickup_schedules')
          .select('*')
          .eq('donation_id', donationId)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: false })
          .limit(1)
        
        console.log('Pickup schedule data:', scheduleData)
        console.log('Pickup schedule error:', scheduleError)
        
        if (scheduleData && scheduleData.length > 0 && !scheduleError) {
          setPickupSchedule(scheduleData[0])
          console.log('Pickup schedule set:', scheduleData[0])
        }
      }
    } catch (err) {
      console.error('Error fetching additional data:', err)
    }
  }

  async function fetchDonationDetail() {
    if (!donationId) return
    
    setLoading(true)

    try {
      // Exactly like admin page
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          donation_matches (
            *,
            beneficiaries (
              id,
              organization_name,
              representative_name,
              phone,
              address
            )
          )
        `)
        .eq('id', donationId)
        .single()

      let finalDonationData = null

      if (error) {
        // If complex query fails, try simpler query
        const { data: simpleDonation } = await supabase
          .from('donations')
          .select('*')
          .eq('id', donationId)
          .single()
        
        if (simpleDonation) {
          setDonation(simpleDonation)
          finalDonationData = simpleDonation
          
          // Fetch donation matches separately
          const { data: matches } = await supabase
            .from('donation_matches')
            .select(`
              *,
              beneficiaries (
                id,
                organization_name,
                representative_name,
                phone,
                address
              )
            `)
            .eq('donation_id', donationId)
          
          if (matches) {
            setDonationMatches(matches)
          }
        }
      } else {
        // Donation data fetched successfully
        setDonation(data)
        finalDonationData = data
        if (data && data.donation_matches) {
          setDonationMatches(data.donation_matches)
        }
      }

      // Fetch quote if exists (최신 견적서 가져오기)
      console.log('Fetching quote for donation:', donationId)
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('donation_id', donationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (quoteError) {
        console.error('Error fetching quote:', quoteError)
      } else if (quoteData) {
        console.log('Quote data fetched:', quoteData)
        console.log('Quote status:', quoteData.status)
        setQuote(quoteData)
      } else {
        console.log('No quote found for donation:', donationId)
      }
      
      // Fetch pickup schedule if status is pickup_scheduled or pickup_coordinating
      if (finalDonationData && (finalDonationData.status === 'pickup_scheduled' || finalDonationData.status === 'pickup_coordinating')) {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('pickup_schedules')
          .select('*')
          .eq('donation_id', donationId)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: false })
          .limit(1)
        
        console.log('Pickup schedule data:', scheduleData)
        console.log('Pickup schedule error:', scheduleError)
        
        if (scheduleData && scheduleData.length > 0 && !scheduleError) {
          setPickupSchedule(scheduleData[0])
          console.log('Pickup schedule set:', scheduleData[0])
        }
      }
    } catch (err) {
      // Error fetching donation detail
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptQuote() {
    if (!quote) {
      console.error('No quote found')
      return
    }

    console.log('=== 견적서 수락 시작 ===')
    console.log('Quote ID:', quote.id)
    console.log('Quote status before:', quote.status)
    console.log('Donation ID:', donationId)

    try {
      // 1. quotes 테이블 업데이트
      console.log('Updating quote status to accepted...')
      const { data: updatedQuote, error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quote.id)
        .select()
        .single()

      if (quoteError) {
        console.error('Quote update error:', quoteError)
        alert(`견적 수락 중 오류가 발생했습니다: ${quoteError.message}`)
        return
      }

      console.log('Quote updated successfully:', updatedQuote)

      // 2. donations 테이블 업데이트
      console.log('Updating donation status to quote_accepted...')
      const { data: updatedDonation, error: donationError } = await supabase
        .from('donations')
        .update({ status: 'quote_accepted' })
        .eq('id', donationId)
        .select()
        .single()

      if (donationError) {
        console.error('Donation update error:', donationError)
        alert(`상태 업데이트 중 오류가 발생했습니다: ${donationError.message}`)
        return
      }

      console.log('Donation updated successfully:', updatedDonation)

      alert('견적을 수락했습니다. 곧 픽업 일정이 조율될 예정입니다.')
      
      // 페이지 새로고침으로 상태 완전히 반영
      console.log('Reloading page...')
      window.location.reload()
    } catch (error) {
      console.error('Unexpected error accepting quote:', error)
      alert('견적 수락 중 오류가 발생했습니다.')
    }
  }

  async function handleRejectQuote() {
    if (!quote) return

    const { error } = await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('id', quote.id)

    if (!error) {
      await supabase
        .from('donations')
        .update({ status: 'pending_review' })
        .eq('id', donationId)

      alert('견적을 거절했습니다.')
      await fetchDonationDetail()
    }
  }

  function getStatusStep(status: string) {
    const stepMap: { [key: string]: number } = {
      'pending_review': 1,
      'quote_sent': 2,
      'matched': 2,
      'quote_accepted': 3,
      'pickup_scheduled': 4,
      'completed': 5
    }
    return stepMap[status] || 1
  }

  if (loading || !donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>
      {loading ? '로딩 중...' : '기부 정보를 찾을 수 없습니다.'}
    </div>
  }

  const currentStep = getStatusStep(donation.status)
  // Check if any donation matches have been received
  const hasReceivedMatch = donationMatches?.some(match => match.status === 'received') || false
  
  const statusBadge = donation.status === 'quote_sent' ? '견적 대기' : 
                     donation.status === 'pickup_scheduled' && hasReceivedMatch ? '수령 완료' :
                     donation.status === 'pickup_scheduled' ? '픽업 예정' :
                     donation.status === 'pickup_coordinating' ? '픽업 예정' : // 임시 처리
                     donation.status === 'completed' ? '기부 완료' : 
                     donation.status === 'quote_accepted' ? '견적 수락' :
                     donation.status === 'pending_review' ? '승인 대기' : '진행중'

  const statusColor = donation.status === 'quote_sent' ? '#FF8C00' :
                      donation.status === 'pickup_scheduled' && hasReceivedMatch ? '#28A745' :
                      donation.status === 'pickup_scheduled' ? '#007BFF' :
                      donation.status === 'pickup_coordinating' ? '#007BFF' : // 임시 처리
                      donation.status === 'completed' ? '#28A745' : '#FF8C00'

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/business/donations">
            <button style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: '#6C757D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '16px' }}>←</span> 목록으로
            </button>
          </Link>
          <span style={{
            backgroundColor: statusColor + '20',
            color: statusColor,
            padding: '6px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {statusBadge}
          </span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          기부 상세 정보
        </h1>

        {/* 기부 정보 & 픽업 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              기부 정보
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>품명: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.name || donation.description}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>수량: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.quantity}{donation.unit || 'kg'}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>등록일: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{new Date(donation.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>유효기간: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              픽업 희망 정보
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>픽업 희망일: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>희망 시간: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{'미정'}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>픽업 장소: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.pickup_location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 기부 물품 사진 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
            기부 물품 사진
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {donation.photos && donation.photos.length > 0 ? (
              donation.photos.map((photo, idx) => (
                <div key={idx} style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#F8F9FA'
                }}>
                  <img 
                    src={photo} 
                    alt={`기부 물품 사진 ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ADB5BD; fontSize: 14px">이미지 로드 실패</div>';
                    }}
                  />
                </div>
              ))
            ) : (
              [1, 2, 3].map((idx) => (
                <div key={idx} style={{
                  aspectRatio: '1',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ADB5BD',
                  fontSize: '14px'
                }}>
                  이미지 없음
                </div>
              ))
            )}
          </div>
        </div>

        {/* 진행 상태 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
            진행 상태
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '60px',
              right: '60px',
              height: '2px',
              backgroundColor: '#E9ECEF',
              zIndex: 0
            }} />
            {statusSteps.map((step, index) => {
              const isActive = index + 1 <= currentStep
              const isCompleted = index + 1 < currentStep
              return (
                <div key={step.key} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  zIndex: 1,
                  position: 'relative'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#02391f' : '#E9ECEF',
                    color: isActive ? 'white' : '#ADB5BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: isActive ? '#212529' : '#ADB5BD',
                    fontWeight: isActive ? '500' : '400'
                  }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 견적서 섹션 */}
        {(donation.status === 'quote_sent' || donation.status === 'matched' || donation.status === 'quote_accepted') && quote && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '2px solid #ffd020',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              견적서
            </h3>
            <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '16px' }}>
              {quote.status === 'accepted' ? 
                `견적서를 수락했습니다. (${quote.created_at ? new Date(quote.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')})` :
                quote.status === 'rejected' ?
                `견적서를 거절했습니다. (${quote.created_at ? new Date(quote.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')})` :
                `견적서가 도착했습니다. (${quote.created_at ? new Date(quote.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')})`
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowQuoteModal(true)}
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#007BFF',
                  backgroundColor: 'white',
                  border: '1px solid #007BFF',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#007BFF'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.color = '#007BFF'
                }}
              >
                견적서 확인
              </button>
              {quote.status !== 'accepted' && quote.status !== 'rejected' && (
                <>
                  <button
                    onClick={handleRejectQuote}
                    style={{
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: '#DC3545',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C82333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC3545'}
                  >
                    거절
                  </button>
                  <button
                    onClick={handleAcceptQuote}
                    style={{
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: '#007BFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056B3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007BFF'}
                  >
                    수락
                  </button>
                </>
              )}
              {quote.status === 'accepted' && (
                <span style={{ 
                  color: '#28A745', 
                  fontWeight: '500', 
                  fontSize: '14px',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✓ 견적 수락됨
                </span>
              )}
              {quote.status === 'rejected' && (
                <span style={{ 
                  color: '#DC3545', 
                  fontWeight: '500', 
                  fontSize: '14px',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✗ 견적 거절됨
                </span>
              )}
            </div>
          </div>
        )}

        {/* 견적서가 아직 없는 경우 */}
        {(donation.status === 'pending_review' || donation.status === 'rejected') && (
          <div style={{
            backgroundColor: '#FFF3CD',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
              🕐 견적서를 기다리고 있습니다. 곧 연락드리겠습니다.
            </p>
          </div>
        )}

        {/* 픽업 일정 정보 */}
        {(donation.status === 'pickup_scheduled' || donation.status === 'pickup_coordinating') && pickupSchedule && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '2px solid #02391f',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#02391f' }}>
              📅 확정된 픽업 일정
            </h3>
            <div style={{ backgroundColor: '#f0f7f4', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>픽업 날짜</span>
                  <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {new Date(pickupSchedule.pickup_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>픽업 시간</span>
                  <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {pickupSchedule.pickup_time}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>픽업 담당자</span>
                  <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {pickupSchedule.pickup_staff}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>차량 정보</span>
                  <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {pickupSchedule.vehicle_info}
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #d0e7d6', paddingTop: '16px' }}>
                <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>픽업 장소</span>
                <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0', fontWeight: '500' }}>
                  {donation.pickup_location}
                </p>
              </div>
              {pickupSchedule.notes && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d0e7d6' }}>
                  <span style={{ fontSize: '14px', color: '#02391f', fontWeight: '600' }}>참고사항</span>
                  <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0 0 0' }}>{pickupSchedule.notes}</p>
                </div>
              )}
            </div>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px', 
              padding: '12px',
              backgroundColor: '#ffd020',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                📦 수혜기관에서 물품 수령을 완료하면 영수증을 발급합니다
              </span>
            </div>
          </div>
        )}

        {/* 영수증 섹션 */}
        {donation.status === 'completed' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #28A745'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              기부영수증
            </h2>
            {(!donationMatches || donationMatches.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '16px' }}>
                  아직 수혜기관이 영수증을 발급하지 않았습니다.
                </p>
                <p style={{ fontSize: '13px', color: '#999' }}>
                  수혜기관에서 물품 수령 후 영수증을 발급하면 여기서 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              donationMatches.map((match, index) => (
                <div key={match.id} style={{ 
                  padding: '16px', 
                  backgroundColor: '#F8F9FA', 
                  borderRadius: '8px',
                  marginBottom: index < donationMatches.length - 1 ? '16px' : '0'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                        기관명
                      </label>
                      <div style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                        {match.beneficiaries?.organization_name}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                        대표자
                      </label>
                      <div style={{ fontSize: '14px', color: '#212529' }}>
                        {match.beneficiaries?.representative_name}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                        연락처
                      </label>
                      <div style={{ fontSize: '14px', color: '#212529' }}>
                        {match.beneficiaries?.phone}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                        수령 수량
                      </label>
                      <div style={{ fontSize: '14px', color: '#212529' }}>
                        {match.accepted_quantity} {donation.unit || 'kg'}
                      </div>
                    </div>
                  </div>
                  
                  {/* 영수증 정보 */}
                  {match.receipt_issued ? (
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #DEE2E6' 
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#495057' }}>
                        기부영수증
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#6C757D' }}>
                          발행일: {match.receipt_issued_at ? new Date(match.receipt_issued_at).toLocaleDateString('ko-KR') : '-'}
                        </span>
                        {match.receipt_file_url && (
                          <a
                            href={match.receipt_file_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#02391f',
                              border: 'none',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              display: 'inline-block'
                            }}
                          >
                            영수증 다운로드
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #DEE2E6',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '13px', color: '#6C757D' }}>
                        아직 영수증이 발급되지 않았습니다.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quote Detail Modal */}
      {quote && (
        <QuoteDetailModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          quote={quote as any}
          donationInfo={{
            description: donation.name || donation.description,
            quantity: donation.quantity,
            unit: donation.unit || 'kg',
            pickup_location: donation.pickup_location,
            pickup_deadline: donation.pickup_deadline,
            created_at: donation.created_at
          }}
          onAccept={handleAcceptQuote}
          onReject={handleRejectQuote}
        />
      )}
    </div>
  )
}