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

  // 단가 변경시 부가세 자동 계산 (10%)
  const handleUnitPriceChange = (value: string) => {
    const unitPrice = parseInt(value) || 0
    const totalAcceptedQuantity = donationMatches.reduce((sum, match) => 
      sum + (match.accepted_quantity || 0), 0
    )
    const totalPrice = unitPrice * totalAcceptedQuantity
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
      const totalAcceptedQuantity = donationMatches.reduce((sum, match) => 
        sum + (match.accepted_quantity || 0), 0
      )
      const supplyPrice = unitPrice * totalAcceptedQuantity
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
      
      // 매칭된 수혜기관이 없는 경우
      if (donationMatches.length === 0) {
        alert('매칭된 수혜기관이 없습니다. 먼저 수혜기관을 매칭해주세요.')
        setLoading(false)
        return
      }

      console.log('Form data:', formData)
      console.log('Selected beneficiaries:', selectedBeneficiaries)
      console.log('Donation matches:', donationMatches)

      // Calculate total amount based on all matched beneficiaries' accepted quantities
      const unitPrice = parseInt(formData.unit_price) || 0
      const totalAcceptedQuantity = donationMatches.reduce((sum, match) => 
        sum + (match.accepted_quantity || 0), 0
      )
      const supplyPrice = unitPrice * totalAcceptedQuantity
      const logisticsCost = parseInt(formData.logistics_cost) || 0
      const totalAmount = supplyPrice + logisticsCost

      console.log('Calculated amounts:', { unitPrice, supplyPrice, logisticsCost, totalAmount })

      let quoteId = savedQuote?.id

      // 임시저장된 견적서가 있으면 업데이트, 없으면 새로 생성
      if (savedQuote) {
        console.log('Updating existing quote:', savedQuote.id)
        
        let updatePayload: any = {
          unit_price: unitPrice,
          logistics_cost: logisticsCost,
          total_amount: totalAmount,
          special_notes: formData.special_notes,
          status: 'pending',
          estimated_pickup_date: donation?.pickup_deadline || new Date().toISOString()
        }
        
        const { data: updateData, error } = await supabase
          .from('quotes')
          .update(updatePayload)
          .eq('id', savedQuote.id)
          .select()
        
        if (error) {
          console.error('Quote update error details:', error)
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          console.error('Error details:', error.details)
          throw error
        } else {
          console.log('Quote updated successfully:', updateData)
        }
      } else {
        console.log('Creating new quote for donation_id:', params.id)
        
        // Basic insert data without potentially missing columns
        const insertData: any = {
          donation_id: params.id,
          unit_price: unitPrice,
          logistics_cost: logisticsCost,
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

  // 화면에 표시할 총 금액 계산 (매칭된 모든 수혜기관의 수량 합계)
  const totalAcceptedQuantity = donationMatches.reduce((sum, match) => 
    sum + (match.accepted_quantity || 0), 0
  )
  const supplyPrice = (parseInt(formData.unit_price) || 0) * totalAcceptedQuantity
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

        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered!')
          handleSubmit(e)
        }}>
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
                  {totalAcceptedQuantity}{donation.unit || 'kg'}
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
                  {supplyPrice.toLocaleString()} 원
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
                
                if (selectedBeneficiaries.length === 0) {
                  alert('수혜기관을 선택해주세요.')
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