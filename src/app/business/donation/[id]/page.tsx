'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import QuoteDetailModal from '@/components/QuoteDetailModal'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const ReceiptTemplate = dynamic(() => import('@/app/beneficiary/receipts/ReceiptTemplate'), { ssr: false })

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

export default function DonationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [donation, setDonation] = useState<Donation | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [receiptInfo, setReceiptInfo] = useState<any>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    fetchDonationDetail()
  }, [params.id])

  async function fetchDonationDetail() {
    if (!params.id) return

    const { data: donationData } = await supabase
      .from('donations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (donationData) {
      setDonation(donationData)

      // Fetch quote if exists
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('donation_id', params.id)
        .single()

      if (quoteData) {
        setQuote(quoteData)
      }

      // Check if receipt is issued
      const { data: matchData } = await supabase
        .from('donation_matches')
        .select(`
          *,
          beneficiaries (
            *
          )
        `)
        .eq('donation_id', params.id)
        .eq('receipt_issued', true)
        .single()

      if (matchData) {
        
        setReceiptInfo(matchData)
      }
    }

    setLoading(false)
  }

  async function handleAcceptQuote() {
    if (!quote) return

    const { error } = await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quote.id)

    if (!error) {
      await supabase
        .from('donations')
        .update({ status: 'pickup_scheduled' })
        .eq('id', params.id)

      alert('견적을 수락했습니다.')
      await fetchDonationDetail()
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
        .eq('id', params.id)

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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>기부 정보를 찾을 수 없습니다.</div>
  }

  const currentStep = getStatusStep(donation.status)
  const statusBadge = donation.status === 'quote_sent' ? '견적 대기' : 
                     donation.status === 'pickup_scheduled' ? '견적 수락' :
                     donation.status === 'completed' ? '픽업 완료' : 
                     donation.status === 'pending_review' ? '승인 대기' : '진행중'

  const statusColor = donation.status === 'quote_sent' ? '#FF8C00' :
                      donation.status === 'pickup_scheduled' ? '#007BFF' :
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
              픽업 정보
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>픽업 희망일: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>장소: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>서울시 강남구 테헤란로 123 ○○빌딩 5층</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>담당자: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>홍길동</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D' }}>연락처: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>010-1234-1234</span>
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
            border: '2px solid #ffd020'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              견적서
            </h3>
            <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '16px' }}>
              견적서가 도착했습니다. ({quote.created_at ? new Date(quote.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')})
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
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
              🕐 견적서를 기다리고 있습니다. 곧 연락드리겠습니다.
            </p>
          </div>
        )}

        {/* 영수증 다운로드 섹션 */}
        {receiptInfo && receiptInfo.receipt_issued && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '2px solid #28A745'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              기부영수증
            </h3>
            <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '16px' }}>
              기부영수증이 발행되었습니다. ({receiptInfo.receipt_issued_at ? new Date(receiptInfo.receipt_issued_at).toLocaleDateString('ko-KR') : ''})
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {receiptInfo && receiptInfo.receipt_file_url ? (
                <a
                  href={receiptInfo.receipt_file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#28A745',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28A745'}
                >
                  영수증 다운로드
                </a>
              ) : (
                <span style={{ fontSize: '14px', color: '#6C757D' }}>
                  영수증 파일이 아직 업로드되지 않았습니다.
                </span>
              )}
            </div>
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