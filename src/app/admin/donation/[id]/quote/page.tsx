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
    commission_rate: '10', // 수수료율 (기본 10%)
    special_notes: ''
  })
  const [savedQuote, setSavedQuote] = useState<any>(null)

  useEffect(() => {
    fetchData()
    loadSavedQuote()
  }, [params.id])

  async function loadSavedQuote() {
    try {
      // 기존 견적서 불러오기 (status 상관없이 가장 최신 것)
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('donation_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const quoteData = quotes?.[0]

      if (quoteData) {
        setSavedQuote(quoteData)
        setFormData({
          unit_price: quoteData.unit_price?.toString() || '',
          commission_rate: quoteData.commission_rate?.toString() || '10',
          special_notes: quoteData.special_notes || ''
        })
      }
    } catch (error) {
      // No saved quote
    }
  }

  async function fetchData() {
    console.log('Fetching data for donation:', params.id)
    try {
      // 1. 기부 정보 가져오기 (businesses 테이블 조인 제거)
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', params.id)
        .single()

      console.log('Donation data:', donationData)
      console.log('Donation error:', donationError)
      
      // 2. businesses 정보 별도로 가져오기
      if (donationData && donationData.business_id) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', donationData.business_id)
          .single()
        
        if (businessData) {
          donationData.businesses = businessData
        }
        console.log('Business data:', businessData)
      }

      if (donationData) {
        setDonation(donationData)
      }

      // 3. donation_matches에서 매칭 정보 가져오기 (모든 상태)
      const { data: matchData, error: matchError } = await supabase
        .from('donation_matches')
        .select('*')
        .eq('donation_id', params.id)

      console.log('Match data:', matchData)
      console.log('Match error:', matchError)

      if (matchData && matchData.length > 0) {
        // 수혜기관 정보 별도로 가져오기
        const beneficiaryIds = matchData.map(m => m.beneficiary_id).filter(Boolean)
        console.log('Beneficiary IDs:', beneficiaryIds)
        
        if (beneficiaryIds.length > 0) {
          const { data: beneficiariesData } = await supabase
            .from('beneficiaries')
            .select('*')
            .in('id', beneficiaryIds)
          
          console.log('Beneficiaries data:', beneficiariesData)
          
          if (beneficiariesData) {
            // matchData에 beneficiary 정보 추가
            const matchesWithBeneficiaries = matchData.map(match => ({
              ...match,
              beneficiaries: beneficiariesData.find(b => b.id === match.beneficiary_id)
            }))
            
            setDonationMatches(matchesWithBeneficiaries)
            setBeneficiaries(beneficiariesData)
            // 매칭된 모든 수혜기관을 자동으로 선택 (수정할 수 없음)
            setSelectedBeneficiaries(matchData.map(m => m.beneficiary_id))
          }
        }
      } else {
        console.log('No matches found')
        // 매칭이 없으면 모든 상태 확인
        const { data: allMatchData } = await supabase
          .from('donation_matches')
          .select('*')
          .eq('donation_id', params.id)
        
        console.log('All matches for this donation:', allMatchData)
        if (allMatchData && allMatchData.length > 0) {
          console.log('Match status:', allMatchData.map(m => ({ id: m.id, status: m.status, accepted_quantity: m.accepted_quantity })))
          // status에 관계없이 모든 매칭을 처리
          const beneficiaryIds = allMatchData.map(m => m.beneficiary_id).filter(Boolean)
          
          if (beneficiaryIds.length > 0) {
            const { data: beneficiariesData } = await supabase
              .from('beneficiaries')
              .select('*')
              .in('id', beneficiaryIds)
            
            if (beneficiariesData) {
              const matchesWithBeneficiaries = allMatchData.map(match => ({
                ...match,
                beneficiaries: beneficiariesData.find(b => b.id === match.beneficiary_id)
              }))
              
              setDonationMatches(matchesWithBeneficiaries)
              setBeneficiaries(beneficiariesData)
              setSelectedBeneficiaries(allMatchData.map(m => m.beneficiary_id))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 금액 계산 함수
  const calculateAmounts = () => {
    const unitPrice = parseInt(formData.unit_price) || 0
    const totalQuantity = donationMatches.length > 0
      ? donationMatches.reduce((sum, match) => sum + (match.accepted_quantity || 0), 0)
      : (donation?.quantity || 0)

    const supplyPrice = unitPrice * totalQuantity
    const commissionRate = parseFloat(formData.commission_rate) || 10
    const commissionAmount = Math.round(supplyPrice * (commissionRate / 100))
    const vatAmount = Math.round(supplyPrice * 0.1)
    const totalAmount = supplyPrice + commissionAmount + vatAmount

    return { supplyPrice, commissionAmount, vatAmount, totalAmount }
  }

  // 임시저장 기능
  async function handleSaveDraft() {
    setLoading(true)
    try {
      const unitPrice = parseInt(formData.unit_price) || 0
      const { supplyPrice, commissionAmount, vatAmount, totalAmount } = calculateAmounts()
      const commissionRate = parseFloat(formData.commission_rate) || 10

      if (savedQuote) {
        // 기존 임시저장 업데이트
        await supabase
          .from('quotes')
          .update({
            unit_price: unitPrice,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            logistics_cost: vatAmount,
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
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            logistics_cost: vatAmount,
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
    console.log('Submit clicked - Starting quote submission')
    console.log('Donation ID:', params.id)
    setLoading(true)

    try {
      // 필수 필드 검증
      if (!formData.unit_price) {
        alert('단가를 입력해주세요.')
        setLoading(false)
        return
      }
      
      // 수혜자 매칭은 견적서 수락 후에 진행되므로 검증 제거

      console.log('Form data:', formData)
      console.log('Selected beneficiaries:', selectedBeneficiaries)
      console.log('Donation matches:', donationMatches)

      // Calculate total amount based on all matched beneficiaries' accepted quantities
      const unitPrice = parseInt(formData.unit_price) || 0
      const commissionRate = parseFloat(formData.commission_rate) || 10
      const { supplyPrice, commissionAmount, vatAmount, totalAmount } = calculateAmounts()

      console.log('Calculated amounts:', { unitPrice, supplyPrice, commissionAmount, vatAmount, totalAmount })

      let quoteId = savedQuote?.id

      // 기존 견적서 확인 (savedQuote가 없어도 DB에서 다시 확인)
      const { data: existingQuotes } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('donation_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const existingQuote = existingQuotes?.[0]

      // 기존 견적서가 있으면 업데이트, 없으면 새로 생성
      if (existingQuote || savedQuote) {
        const quoteIdToUpdate = savedQuote?.id || existingQuote?.id
        console.log('Updating existing quote:', quoteIdToUpdate)

        let updatePayload: any = {
          unit_price: unitPrice,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          logistics_cost: vatAmount,
          total_amount: totalAmount,
          special_notes: formData.special_notes,
          status: 'pending',
          estimated_pickup_date: donation?.pickup_deadline || new Date().toISOString()
        }

        const { data: updateData, error } = await supabase
          .from('quotes')
          .update(updatePayload)
          .eq('id', quoteIdToUpdate)
          .select()

        if (error) {
          console.error('Quote update error details:', error)
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          console.error('Error details:', error.details)
          throw error
        } else {
          console.log('Quote updated successfully:', updateData)
          quoteId = quoteIdToUpdate
        }
      } else {
        console.log('Creating new quote for donation_id:', params.id)
        
        // Basic insert data without potentially missing columns
        const insertData: any = {
          donation_id: params.id,
          unit_price: unitPrice,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          logistics_cost: vatAmount,
          total_amount: totalAmount,
          special_notes: formData.special_notes,
          status: 'pending',
          estimated_pickup_date: donation?.pickup_deadline || new Date().toISOString()
        }
        console.log('Insert data:', insertData)
        
        const { data: insertedData, error } = await supabase
          .from('quotes')
          .insert(insertData)
          .select()
        
        if (error) {
          console.error('Quote insert error details:', error)
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          console.error('Error details:', error.details)
          console.error('Error hint:', error.hint)
          
          // If it's a column error, provide more specific guidance
          if (error.code === '42703') {
            console.error('Column does not exist. Check your quotes table schema.')
          }
          throw error
        }
        console.log('Quote inserted successfully:', insertedData)
        if (insertedData && insertedData[0]) {
          quoteId = insertedData[0].id
        }
      }

      // Update donation_matches status to 'quote_sent' for selected beneficiaries
      console.log('Updating donation matches for beneficiaries:', selectedBeneficiaries)
      console.log('Available donation matches:', donationMatches.map(m => ({ id: m.id, beneficiary_id: m.beneficiary_id, beneficiary: m.beneficiaries?.id })))
      
      let matchUpdateCount = 0
      for (const beneficiaryId of selectedBeneficiaries) {
        // Check both beneficiary_id and beneficiaries.id since the structure might vary
        const match = donationMatches.find(m => 
          m.beneficiary_id === beneficiaryId || 
          (m.beneficiaries && m.beneficiaries.id === beneficiaryId)
        )
        
        if (match) {
          console.log(`Updating match ${match.id} for beneficiary ${beneficiaryId}`)
          
          // Try updating with minimal fields first
          const { data: matchData, error } = await supabase
            .from('donation_matches')
            .update({ 
              status: 'quote_sent'
            })
            .eq('id', match.id)
            .select()
          
          if (error) {
            console.error(`Match update error for ${match.id}:`, error)
            console.error('Error code:', error.code)
            console.error('Error message:', error.message)
            
            // Don't throw on match update errors, just log them
            console.warn(`Failed to update match ${match.id}, continuing...`)
          } else {
            console.log(`Match ${match.id} updated:`, matchData)
            matchUpdateCount++
          }
        } else {
          console.warn(`No match found for beneficiary ${beneficiaryId}`)
          console.warn('Available matches:', donationMatches)
        }
      }
      console.log(`Updated ${matchUpdateCount} donation matches`)

      // Update donation status
      console.log('Updating donation status for donation_id:', params.id)
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .update({ 
          status: 'quote_sent'
        })
        .eq('id', params.id)
        .select()
      
      if (donationError) {
        console.error('Donation update error:', donationError)
        console.error('Error code:', donationError.code)
        console.error('Error message:', donationError.message)
        console.error('Error details:', donationError.details)
        
        // Don't let donation update failure block the whole process
        console.warn('Failed to update donation status, but quote was sent successfully')
      } else {
        console.log('Donation status updated:', donationData)
      }

      console.log('All updates completed successfully')

      // 기업에게 견적서 발송 완료 이메일 전송
      try {
        if (donation?.businesses) {
          const businessEmail = donation.businesses.email
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: businessEmail,
              type: 'business_quote_ready',
              donationName: donation.name,
              quoteAmount: totalAmount.toLocaleString()
            })
          })
        }
      } catch (emailError) {
        console.error('견적서 이메일 발송 실패:', emailError)
        // 이메일 실패해도 견적서 발송은 성공으로 처리
      }

      alert('견적서가 성공적으로 발송되었습니다.')
      router.push('/admin/donations')
    } catch (error: any) {
      console.error('Error during submission:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      alert(`견적서 업로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  // 화면에 표시할 총 금액 계산
  const totalQuantity = donationMatches.length > 0
    ? donationMatches.reduce((sum, match) => sum + (match.accepted_quantity || 0), 0)
    : (donation?.quantity || 0)

  const { supplyPrice, commissionAmount, vatAmount, totalAmount } = calculateAmounts()

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

        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered!')
          handleSubmit(e)
        }}>
          {/* 수혜자가 아직 선정되지 않았을 때 안내 메시지 */}
          {donationMatches.length === 0 && (
            <div style={{
              backgroundColor: '#FFF9E6',
              border: '1px solid #ffd020',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                    아직 수혜기관이 선정되지 않았습니다
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6C757D' }}>
                    견적서가 기부자에게 수락되면 수혜기관을 선정할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                매칭된 수혜기관 ({donationMatches.length}개)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {donationMatches.map((match) => {
                  const beneficiary = match.beneficiaries;
                  if (!beneficiary) return null;
                  return (
                    <div 
                      key={match.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '12px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '8px',
                        backgroundColor: '#F8F9FA'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{beneficiary.organization_name}</div>
                        <div style={{ fontSize: '13px', color: '#6C757D' }}>
                          {beneficiary.organization_type} | {beneficiary.phone} | {beneficiary.email}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6C757D', marginTop: '4px' }}>
                          {beneficiary.address}
                        </div>
                        <div style={{ fontSize: '13px', color: '#02391f', marginTop: '4px', fontWeight: '500' }}>
                          수락 수량: {match.accepted_quantity} {donation?.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              {(donation as any).consumer_price && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>소비자가: </span>
                  <span style={{ fontSize: '14px', color: '#212529' }}>
                    {Number((donation as any).consumer_price).toLocaleString()}원
                  </span>
                </div>
              )}
              {(donation as any).manufacturing_cost && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: '500' }}>제조원가: </span>
                  <span style={{ fontSize: '14px', color: '#212529' }}>
                    {Number((donation as any).manufacturing_cost).toLocaleString()}원
                  </span>
                </div>
              )}
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
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
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
                  {totalQuantity}{donation.unit || 'kg'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
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
                  {supplyPrice.toLocaleString()} 원
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
                  {vatAmount.toLocaleString()} 원
                </div>
              </div>

              {/* 수수료 필드 (어드민 전용) */}
              <div style={{
                backgroundColor: '#FFF9E6',
                border: '1px solid #FFD020',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#856404' }}>⚠️ 어드민 전용</span>
                  <span style={{ fontSize: '12px', color: '#856404' }}>(기부기업/수혜기관에게는 표시되지 않습니다)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>수수료</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="10"
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#212529',
                        fontWeight: '500',
                        border: '1px solid #CED4DA',
                        borderRadius: '4px',
                        outline: 'none',
                        textAlign: 'right',
                        width: '80px'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>%</span>
                  </div>
                  <label style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>수수료 금액</label>
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
                    {commissionAmount.toLocaleString()} 원
                  </div>
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
              type="button"
              onClick={(e) => {
                console.log('=== 견적서 발송 버튼 클릭됨 ===')
                console.log('Loading state:', loading)
                console.log('Selected beneficiaries:', selectedBeneficiaries)
                console.log('Form data:', formData)
                console.log('Donation matches:', donationMatches)
                
                if (!formData.unit_price) {
                  alert('단가를 입력해주세요.')
                  return
                }

                console.log('Calling handleSubmit...')
                handleSubmit(e as any)
              }}
              disabled={loading}
              style={{
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: loading ? '#6C757D' : '#28A745',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
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