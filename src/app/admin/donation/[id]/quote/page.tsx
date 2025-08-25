'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Donation {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  pickup_location: string
  pickup_deadline: string
  businesses?: {
    name: string
    email: string
    phone: string
    representative_name: string
    address: string // 사업자 등록번호가 address 필드에 저장됨
  }
}

interface Beneficiary {
  id: string
  organization_name: string
  organization_type: string
  email: string
  phone: string
  address: string
}

export default function AdminQuoteUploadPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [donation, setDonation] = useState<Donation | null>(null)
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
  const [donationMatch, setDonationMatch] = useState<any>(null)
  const [formData, setFormData] = useState({
    unit_price: '',
    logistics_cost: '100000', // 기본값 10%
    logistics_percent: '10',
    estimated_pickup_date: '',
    pickup_time: '',
    special_notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [params.id])

  async function fetchData() {
    try {
      // 1. 기부 정보 가져오기
      const { data: donationData } = await supabase
        .from('donations')
        .select(`
          *,
          businesses(name, email, phone, representative_name, address)
        `)
        .eq('id', params.id)
        .single()

      if (donationData) {
        setDonation(donationData)
      }

      // 2. donation_matches에서 proposed 상태의 매칭 정보 가져오기
      const { data: matchData } = await supabase
        .from('donation_matches')
        .select(`
          *,
          beneficiaries(*)
        `)
        .eq('donation_id', params.id)
        .eq('status', 'proposed')
        .single()

      if (matchData) {
        setDonationMatch(matchData)
        setBeneficiary(matchData.beneficiaries)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 단가 변경시 물류비 자동 계산 (10%)
  const handleUnitPriceChange = (value: string) => {
    const unitPrice = parseInt(value) || 0
    const totalPrice = unitPrice * (donation?.quantity || 0)
    const logisticsCost = Math.round(totalPrice * 0.1)
    setFormData({
      ...formData,
      unit_price: value,
      logistics_cost: logisticsCost.toString()
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 필수 필드 검증
      if (!formData.unit_price || !formData.estimated_pickup_date) {
        alert('필수 항목을 모두 입력해주세요.')
        setLoading(false)
        return
      }

      // Calculate total amount
      const unitPrice = parseInt(formData.unit_price) || 0
      const supplyPrice = unitPrice * (donation?.quantity || 0)
      const logisticsCost = parseInt(formData.logistics_cost) || 0
      const totalAmount = supplyPrice + logisticsCost

      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create quote
      console.log('Inserting quote with data:', {
        donation_id: params.id,
        unit_price: unitPrice,
        logistics_cost: logisticsCost,
        total_amount: totalAmount,
        estimated_pickup_date: formData.estimated_pickup_date,
        pickup_time: formData.pickup_time,
        special_notes: formData.special_notes,
        status: 'pending'
      })

      const { error: insertQuoteError } = await supabase
        .from('quotes')
        .insert({
          donation_id: params.id,
          unit_price: unitPrice,
          logistics_cost: logisticsCost,
          total_amount: totalAmount,
          estimated_pickup_date: formData.estimated_pickup_date,
          pickup_time: formData.pickup_time,
          special_notes: formData.special_notes,
          status: 'pending'
        })

      if (insertQuoteError) {
        console.error('Detailed quote error:', insertQuoteError)
        throw insertQuoteError
      }

      // Update donation_matches status to 'quote_sent'
      if (donationMatch) {
        const { error: matchUpdateError } = await supabase
          .from('donation_matches')
          .update({ 
            status: 'quote_sent',
            quote_sent_at: new Date().toISOString()
          })
          .eq('id', donationMatch.id)

        if (matchUpdateError) {
          // console.error('Error updating match:', matchUpdateError)
        }
      }

      // Update donation status
      const { error: statusError } = await supabase
        .from('donations')
        .update({ status: 'quote_sent' })
        .eq('id', params.id)

      if (statusError) throw statusError

      alert('견적서가 성공적으로 발송되었습니다.')
      router.push('/admin/donations')
    } catch (error) {
      console.error('Error uploading quote:', error)
      alert('견적서 업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const supplyPrice = (parseInt(formData.unit_price) || 0) * (donation?.quantity || 0)
  const totalAmount = supplyPrice + (parseInt(formData.logistics_cost) || 0)

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/admin/donations">
            <button style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: '#6C757D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '16px' }}>←</span> 견적 관리로 돌아가기
            </button>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
            견적서 작성
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 수혜기관 정보 */}
          {beneficiary && (
            <div style={{
              backgroundColor: '#E8F5E9',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #A5D6A7'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2E7D32' }}>
                선택된 수혜기관
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#1B5E20', fontWeight: '500' }}>기관명: </span>
                  <span style={{ fontSize: '14px', color: '#2E7D32' }}>{beneficiary.organization_name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#1B5E20', fontWeight: '500' }}>유형: </span>
                  <span style={{ fontSize: '14px', color: '#2E7D32' }}>{beneficiary.organization_type || '기타'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#1B5E20', fontWeight: '500' }}>연락처: </span>
                  <span style={{ fontSize: '14px', color: '#2E7D32' }}>{beneficiary.phone}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#1B5E20', fontWeight: '500' }}>이메일: </span>
                  <span style={{ fontSize: '14px', color: '#2E7D32' }}>{beneficiary.email}</span>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#1B5E20', fontWeight: '500' }}>주소: </span>
                <span style={{ fontSize: '14px', color: '#2E7D32' }}>{beneficiary.address}</span>
              </div>
            </div>
          )}

          {/* 기부 정보 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              기부 정보
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>회원사: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>{donation.businesses?.name}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>품명: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>{donation.name || donation.description}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>수량: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>{donation.quantity}{donation.unit || 'kg'}</span>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>픽업 희망일: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>픽업 장소: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>서울시 강남구 테헤란로 123 ○○빌딩 5층</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>등록일: </span>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '400' }}>{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 견적 금액 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              견적 금액
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                  {donation.unit === '개' ? '개당' : 'kg당'} 단가 *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.unit_price}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    required
                    placeholder="0"
                    style={{
                      padding: '8px 60px 8px 12px',
                      fontSize: '14px',
                      color: '#212529',
                      fontWeight: '500',
                      border: '1px solid #CED4DA',
                      borderRadius: '4px',
                      outline: 'none',
                      textAlign: 'right',
                      width: '100%'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '13px',
                    color: '#6C757D',
                    fontWeight: '400'
                  }}>
                    원
                  </span>
                </div>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>수량</label>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#212529',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  textAlign: 'right'
                }}>
                  {donation.quantity}{donation.unit || 'kg'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>공급가액</label>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#212529',
                  fontWeight: '500',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  textAlign: 'right'
                }}>
                  {((parseInt(formData.unit_price) || 0) * donation.quantity).toLocaleString()} 원
                </div>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>부가세 (10%)</label>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#212529',
                  fontWeight: '500',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  textAlign: 'right'
                }}>
                  {formData.logistics_cost.toLocaleString()} 원
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E9ECEF', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>총 금액</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#212529' }}>
                    {totalAmount.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 견적 조건 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              견적 조건
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>픽업 가능 일정 *</label>
                <input
                  type="date"
                  value={formData.estimated_pickup_date}
                  onChange={(e) => setFormData({ ...formData, estimated_pickup_date: e.target.value })}
                  required
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#212529',
                    border: '1px solid #CED4DA',
                    borderRadius: '4px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>픽업 가능 시간 *</label>
                <input
                  type="text"
                  value={formData.pickup_time}
                  onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                  placeholder="예: 오전 10시 ~ 오후 5시"
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#212529',
                    border: '1px solid #CED4DA',
                    borderRadius: '4px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 특이사항 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px',
              color: '#212529',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              특이사항
            </label>
            <textarea
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              rows={4}
              placeholder="추가 조건이나 안내사항을 입력하세요."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                color: '#212529',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 새금계산서 정보 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              세금계산서 정보
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>공급받는자 (사업자명)</span>
              <div style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#212529',
                backgroundColor: '#F8F9FA',
                border: '1px solid #CED4DA',
                borderRadius: '4px'
              }}>
                {donation.businesses?.name}
              </div>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>사업자등록번호</span>
              <div style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#212529',
                backgroundColor: '#F8F9FA',
                border: '1px solid #CED4DA',
                borderRadius: '4px'
              }}>
                {donation.businesses?.address || '123-45-67890'}
              </div>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>대표자명</span>
              <div style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#212529',
                backgroundColor: '#F8F9FA',
                border: '1px solid #CED4DA',
                borderRadius: '4px'
              }}>
                {donation.businesses?.representative_name || '홍길동'}
              </div>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>발행일자 *</span>
              <div style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#212529',
                backgroundColor: '#F8F9FA',
                border: '1px solid #CED4DA',
                borderRadius: '4px'
              }}>
                {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/admin/donations">
              <button
                type="button"
                style={{
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #6C757D',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                임시 저장
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: loading ? '#6C757D' : '#FFC107',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '발송 중...' : '견적서 발송'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}