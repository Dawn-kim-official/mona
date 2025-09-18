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
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([])
  const [donationMatches, setDonationMatches] = useState<any[]>([])
  const [formData, setFormData] = useState({
    unit_price: '',
    logistics_cost: '0', // 부가세를 0으로 변경
    logistics_percent: '10',
    special_notes: ''
  })
  const [savedQuote, setSavedQuote] = useState<any>(null)

  useEffect(() => {
    fetchData()
    loadSavedQuote()
  }, [params.id])

  async function loadSavedQuote() {
    try {
      // 임시저장된 견적서 불러오기
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('donation_id', params.id)
        .eq('status', 'draft')
        .single()

      if (quoteData) {
        setSavedQuote(quoteData)
        setFormData({
          unit_price: quoteData.unit_price?.toString() || '',
          logistics_cost: quoteData.logistics_cost?.toString() || '0',
          logistics_percent: '10',
          special_notes: quoteData.special_notes || ''
        })
      }
    } catch (error) {
      // No saved draft
    }
  }

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

      if (matchData && matchData.length > 0) {
        setDonationMatches(matchData)
        const beneficiaryList = matchData.map(match => match.beneficiaries).filter(Boolean)
        setBeneficiaries(beneficiaryList)
        // 기본적으로 모든 수혜기관 선택
        setSelectedBeneficiaries(beneficiaryList.map(b => b.id))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 단가 변경시 부가세 자동 계산 (10%)
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

  // 임시저장 기능
  async function handleSaveDraft() {
    setLoading(true)
    try {
      const unitPrice = parseInt(formData.unit_price) || 0
      const supplyPrice = unitPrice * (donation?.quantity || 0)
      const logisticsCost = parseInt(formData.logistics_cost) || 0
      const totalAmount = supplyPrice + logisticsCost

      if (savedQuote) {
        // 기존 임시저장 업데이트
        await supabase
          .from('quotes')
          .update({
            unit_price: unitPrice,
            logistics_cost: logisticsCost,
            total_amount: totalAmount,
            special_notes: formData.special_notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', savedQuote.id)
      } else {
        // 새로운 임시저장
        const { data } = await supabase
          .from('quotes')
          .insert({
            donation_id: params.id,
            unit_price: unitPrice,
            logistics_cost: logisticsCost,
            total_amount: totalAmount,
            special_notes: formData.special_notes,
            status: 'draft'
          })
          .select()
          .single()
        
        setSavedQuote(data)
      }

      alert('견적서가 임시저장되었습니다.')
    } catch (error) {
      alert('임시저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 필수 필드 검증
      if (!formData.unit_price || selectedBeneficiaries.length === 0) {
        alert('필수 항목을 모두 입력해주세요.')
        setLoading(false)
        return
      }

      // Calculate total amount
      const unitPrice = parseInt(formData.unit_price) || 0
      const supplyPrice = unitPrice * (donation?.quantity || 0)
      const logisticsCost = parseInt(formData.logistics_cost) || 0
      const totalAmount = supplyPrice + logisticsCost

      // 임시저장된 견적서가 있으면 업데이트, 없으면 새로 생성
      if (savedQuote) {
        await supabase
          .from('quotes')
          .update({
            unit_price: unitPrice,
            logistics_cost: logisticsCost,
            total_amount: totalAmount,
            special_notes: formData.special_notes,
            status: 'pending',
            sent_at: new Date().toISOString()
          })
          .eq('id', savedQuote.id)
      } else {
        await supabase
          .from('quotes')
          .insert({
            donation_id: params.id,
            unit_price: unitPrice,
            logistics_cost: logisticsCost,
            total_amount: totalAmount,
            special_notes: formData.special_notes,
            status: 'pending'
          })
      }

      // Update donation_matches status to 'quote_sent' for selected beneficiaries
      for (const beneficiaryId of selectedBeneficiaries) {
        const match = donationMatches.find(m => m.beneficiary_id === beneficiaryId)
        if (match) {
          await supabase
            .from('donation_matches')
            .update({ 
              status: 'quote_sent',
              quote_sent_at: new Date().toISOString()
            })
            .eq('id', match.id)
        }
      }

      // Update donation status
      await supabase
        .from('donations')
        .update({ status: 'quote_sent' })
        .eq('id', params.id)

      alert('견적서가 성공적으로 발송되었습니다.')
      router.push('/admin/donations')
    } catch (error) {
      console.error('Error:', error)
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
          {/* 수혜기관 선택 (복수 선택 가능) */}
          {beneficiaries.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                수혜기관 선택 (복수 선택 가능)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {beneficiaries.map((beneficiary) => (
                  <label 
                    key={beneficiary.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedBeneficiaries.includes(beneficiary.id) ? '#E8F5E9' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBeneficiaries.includes(beneficiary.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBeneficiaries([...selectedBeneficiaries, beneficiary.id])
                        } else {
                          setSelectedBeneficiaries(selectedBeneficiaries.filter(id => id !== beneficiary.id))
                        }
                      }}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{beneficiary.organization_name}</div>
                      <div style={{ fontSize: '13px', color: '#6C757D' }}>
                        {beneficiary.organization_type} | {beneficiary.phone} | {beneficiary.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6C757D', marginTop: '4px' }}>
                        {beneficiary.address}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 기부품 정보 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              기부품 정보
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>품목: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.name || donation.description}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>수량: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.quantity}{donation.unit || 'kg'}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>픽업 위치: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>{donation.pickup_location}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>픽업 마감일: </span>
                <span style={{ fontSize: '14px', color: '#212529' }}>
                  {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                </span>
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.logistics_cost}
                    onChange={(e) => setFormData({ ...formData, logistics_cost: e.target.value })}
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

          {/* 특이사항 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              특이사항
            </h2>
            <textarea
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              placeholder="특이사항이 있으면 입력하세요"
              rows={4}
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

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529',
                backgroundColor: 'white',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              임시저장
            </button>
            <button
              type="submit"
              disabled={loading || selectedBeneficiaries.length === 0}
              style={{
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: (loading || selectedBeneficiaries.length === 0) ? '#6C757D' : '#28A745',
                border: 'none',
                borderRadius: '4px',
                cursor: (loading || selectedBeneficiaries.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (loading || selectedBeneficiaries.length === 0) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? '처리 중...' : '견적서 발송'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}