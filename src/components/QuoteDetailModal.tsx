'use client'

import { useEffect } from 'react'

interface Quote {
  id: string
  donation_id: string
  quote_amount: number
  pickup_fee: number
  tax_amount: number
  total_amount: number
  pickup_date: string
  notes?: string
  created_at: string
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
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              color: '#1B4D3E',
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
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '32px' }}>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '32px',
              fontSize: '14px'
            }}>
              발송된 견적서의 상세 내역입니다.
            </p>

            {/* 기부 정보 섹션 */}
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
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>회원사:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>주식회사 ABC</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>픽업 희망일:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                    {new Date(donationInfo.pickup_deadline).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>품명:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{donationInfo.description}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>픽업 장소:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{donationInfo.pickup_location}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>수량:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                    {donationInfo.quantity}{donationInfo.unit}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>등록일:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                    {new Date(donationInfo.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 견적 금액 섹션 */}
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
                견적 금액
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '15px' }}>단가:</span>
                  <span style={{ color: '#111827', fontSize: '15px', fontWeight: '500' }}>
                    {quote.quote_amount.toLocaleString()} 원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '15px' }}>공급가액:</span>
                  <span style={{ color: '#111827', fontSize: '15px', fontWeight: '500' }}>
                    {(quote.total_amount - quote.tax_amount).toLocaleString()} 원
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '15px' }}>부가세 (10%):</span>
                  <span style={{ color: '#111827', fontSize: '15px', fontWeight: '500' }}>
                    {quote.tax_amount.toLocaleString()} 원
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb',
                  marginTop: '8px'
                }}>
                  <span style={{ color: '#111827', fontSize: '17px', fontWeight: '600' }}>총금액:</span>
                  <span style={{ color: '#1B4D3E', fontSize: '20px', fontWeight: '700' }}>
                    {quote.total_amount.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

            {/* 견적 조건 섹션 */}
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
                견적 조건
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>픽업 가능 일정:</p>
                  <p style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
                    {new Date(quote.pickup_date).toLocaleDateString('ko-KR')} (오후 2시)
                  </p>
                </div>
                {quote.notes && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>특이사항:</p>
                    <p style={{ fontSize: '15px', color: '#111827' }}>{quote.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => onReject(quote.id)}
                style={{
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                거절
              </button>
              <button
                onClick={() => onAccept(quote.id)}
                style={{
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: '#FFB800',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(255, 184, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0A800';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 184, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFB800';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 184, 0, 0.2)';
                }}
              >
                수락
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}