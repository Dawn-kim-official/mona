'use client'

import { useEffect } from 'react'

interface Quote {
  id: string
  donation_id: string
  unit_price: number
  commission_rate?: number
  commission_amount?: number
  logistics_cost: number
  total_amount: number
  estimated_pickup_date: string
  pickup_time?: string
  special_notes?: string
  status: string
  created_at?: string
}

interface QuoteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote | null
  donationInfo: {
    description: string
    quantity: number
    unit: string
    pickup_location: string
    pickup_deadline: string
    created_at: string
  } | null
  onAccept: (quoteId: string) => void
  onReject: (quoteId: string) => void
}

export default function QuoteDetailModal({ 
  isOpen, 
  onClose, 
  quote, 
  donationInfo,
  onAccept,
  onReject 
}: QuoteDetailModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !quote || !donationInfo) return null

  // 공급가액 계산 (단가 * 수량)
  const supplyAmount = quote.unit_price * donationInfo.quantity
  // 수수료 계산 (DB에서 가져온 값 사용)
  const commissionAmount = quote.commission_amount || 0
  // 부가세 계산 (공급가액의 10%)
  const vatAmount = Math.round(supplyAmount * 0.1)

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E9ECEF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#212529',
              margin: 0
            }}>
              견적서 상세 정보
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6C757D',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 20px' }}>
            <p style={{ 
              color: '#6C757D', 
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              발송된 견적서의 상세 내역입니다.
            </p>

            {/* 기부 정보 섹션 */}
            <div style={{
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#212529'
              }}>
                기부 정보
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6C757D' }}>회원사: </span>
                  <span style={{ color: '#212529' }}>주식회사 ABC</span>
                </div>
                <div>
                  <span style={{ color: '#6C757D' }}>픽업 희망일: </span>
                  <span style={{ color: '#212529' }}>
                    {new Date(donationInfo.pickup_deadline).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6C757D' }}>품명: </span>
                  <span style={{ color: '#212529' }}>{donationInfo.description}</span>
                </div>
                <div>
                  <span style={{ color: '#6C757D' }}>픽업 장소: </span>
                  <span style={{ color: '#212529' }}>서울시 강남구 테헤란로 123 ○○빌딩 5층</span>
                </div>
                <div>
                  <span style={{ color: '#6C757D' }}>수량: </span>
                  <span style={{ color: '#212529' }}>{donationInfo.quantity}{donationInfo.unit || 'kg'}</span>
                </div>
                <div>
                  <span style={{ color: '#6C757D' }}>등록일: </span>
                  <span style={{ color: '#212529' }}>
                    {new Date(donationInfo.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            {/* 견적 금액 섹션 */}
            <div style={{
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#212529'
              }}>
                견적 금액
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6C757D' }}>단가:</span>
                  <span style={{ color: '#212529' }}>
                    {quote.unit_price.toLocaleString()} 원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6C757D' }}>공급가액:</span>
                  <span style={{ color: '#212529' }}>
                    {supplyAmount.toLocaleString()} 원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6C757D' }}>수수료:</span>
                  <span style={{ color: '#212529' }}>
                    {commissionAmount.toLocaleString()} 원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6C757D' }}>부가세 (10%):</span>
                  <span style={{ color: '#212529' }}>
                    {vatAmount.toLocaleString()} 원
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #DEE2E6',
                  marginTop: '8px'
                }}>
                  <span style={{ color: '#212529', fontSize: '16px', fontWeight: '600' }}>총금액:</span>
                  <span style={{ color: '#212529', fontSize: '18px', fontWeight: '700' }}>
                    {quote.total_amount.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

            {/* 견적 조건 섹션 */}
            <div style={{
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#212529'
              }}>
                견적 조건
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6C757D' }}>픽업 가능 일정: </span>
                  <span style={{ color: '#212529' }}>
                    {new Date(quote.estimated_pickup_date).toLocaleDateString('ko-KR')} 
                    {quote.pickup_time && ` (${quote.pickup_time})`}
                  </span>
                </div>
                {quote.special_notes && (
                  <div>
                    <span style={{ color: '#6C757D' }}>특이사항: </span>
                    <span style={{ color: '#212529' }}>{quote.special_notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>

              {/* 견적서가 pending 상태일 때만 수락/거절 버튼 표시 */}
              {quote && quote.status !== 'accepted' && quote.status !== 'rejected' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (window.confirm('견적서를 거절하시겠습니까?')) {
                        onReject(quote.id)
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#DC3545',
                      backgroundColor: 'white',
                      border: '1px solid #DC3545',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    거절
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('견적서를 수락하시겠습니까?')) {
                        onAccept(quote.id)
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: '#02391f',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    수락
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}