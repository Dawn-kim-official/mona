'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Donation {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  pickup_deadline: string
  pickup_location: string
  businesses?: {
    name: string
  }
}

interface Beneficiary {
  id: string
  organization_name: string
  organization_type: string
  address: string
}

export default function ProposeDonationPage() {
  const router = useRouter()
  const params = useParams()
  const donationId = params.id as string
  const supabase = createClient()
  
  const [donation, setDonation] = useState<Donation | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [donationId])

  async function fetchData() {
    // Fetch donation details
    const { data: donationData, error: donationError } = await supabase
      .from('donations')
      .select(`
        *,
        businesses(name)
      `)
      .eq('id', donationId)
      .single()

    if (donationError) {
      // console.error('Error fetching donation:', donationError)
    } else {
      setDonation(donationData)
    }

    // Fetch approved beneficiaries
    const { data: beneficiaryData, error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .select('id, organization_name, organization_type, address')
      .eq('status', 'approved')
      .order('organization_name')

    if (beneficiaryError) {
      // console.error('Error fetching beneficiaries:', beneficiaryError)
    } else {
      setBeneficiaries(beneficiaryData || [])
    }

    // Generate AI recommendations based on donation details
    if (donationData && beneficiaryData) {
      generateAIRecommendations(donationData, beneficiaryData)
    }

    setLoading(false)
  }

  function generateAIRecommendations(donation: Donation, beneficiaries: Beneficiary[]) {
    // Simple AI recommendation logic based on:
    // 1. Location proximity (same city/district)
    // 2. Organization type matching food donations
    // 3. Random selection for demo purposes
    
    const recommendations: string[] = []
    
    // Extract city from pickup location
    const donationCity = donation.pickup_location.split(' ')[0]
    
    // Priority 1: Same city beneficiaries
    const sameCityBeneficiaries = beneficiaries.filter(b => 
      b.address.includes(donationCity)
    )
    
    // Priority 2: Welfare centers and food banks
    const foodRelatedBeneficiaries = beneficiaries.filter(b => 
      b.organization_type?.includes('복지관') || 
      b.organization_type?.includes('푸드뱅크') ||
      b.organization_type?.includes('급식')
    )
    
    // Combine and deduplicate
    const priorityBeneficiaries = [...new Set([
      ...sameCityBeneficiaries,
      ...foodRelatedBeneficiaries
    ])]
    
    // Take top 3 recommendations
    priorityBeneficiaries.slice(0, 3).forEach(b => {
      recommendations.push(b.id)
    })
    
    // If less than 3, add random beneficiaries
    if (recommendations.length < 3) {
      const remaining = beneficiaries
        .filter(b => !recommendations.includes(b.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - recommendations.length)
      
      remaining.forEach(b => recommendations.push(b.id))
    }
    
    setAiRecommendations(recommendations)
  }

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => {
      if (prev.includes(beneficiaryId)) {
        return prev.filter(id => id !== beneficiaryId)
      } else {
        return [...prev, beneficiaryId]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedBeneficiaries.length === 0) {
      alert('최소 하나의 수혜 기관을 선택해주세요.')
      return
    }

    setSubmitting(true)

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // 선택된 모든 수혜기관에 대해 매칭 정보 생성 또는 업데이트
      for (const beneficiaryId of selectedBeneficiaries) {
        // 먼저 기존 매칭이 있는지 확인
        const { data: existingMatch } = await supabase
          .from('donation_matches')
          .select('id')
          .eq('donation_id', donationId)
          .eq('beneficiary_id', beneficiaryId)
          .single()

        if (existingMatch) {
          // 기존 매칭이 있으면 업데이트
          await supabase
            .from('donation_matches')
            .update({
              status: 'proposed',
              proposed_at: new Date().toISOString(),
              proposed_by: user.id
            })
            .eq('id', existingMatch.id)
        } else {
          // 기존 매칭이 없으면 새로 생성
          await supabase
            .from('donation_matches')
            .insert({
              donation_id: donationId,
              beneficiary_id: beneficiaryId,
              status: 'proposed',
              proposed_at: new Date().toISOString(),
              proposed_by: user.id
            })
        }
      }

      // donations 테이블 상태 업데이트
      const { error: updateError } = await supabase
        .from('donations')
        .update({ status: 'matched' })
        .eq('id', donationId)

      if (updateError) {
        alert(`상태 업데이트 중 오류가 발생했습니다: ${updateError.message}`)
      } else {
        const message = selectedBeneficiaries.length === 1 
          ? '수혜기관이 성공적으로 선정되었습니다.'
          : `${selectedBeneficiaries.length}개의 수혜기관이 성공적으로 선정되었습니다.`
        alert(message)
        router.push('/admin/donations')
      }
    } catch (error: any) {
      // console.error('Error detail:', error)
      // if (error.message) {
      //   console.error('Error message:', error.message)
      // }
      // if (error.details) {
      //   console.error('Error details:', error.details)
      // }
      alert(`수혜기관 선정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>기부 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          수혜 기관 선택
        </h1>

        {/* 기부 정보 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
            기부 정보
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D' }}>품명</label>
              <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0' }}>{donation.name}</p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D' }}>수량</label>
              <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0' }}>
                {donation.quantity}{donation.unit || 'kg'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D' }}>기업명</label>
              <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0' }}>
                {donation.businesses?.name || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D' }}>픽업 희망일</label>
              <p style={{ fontSize: '16px', color: '#212529', margin: '4px 0' }}>
                {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* AI 추천 */}
        {aiRecommendations.length > 0 && (
          <div style={{
            backgroundColor: '#E8F5E9',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #A5D6A7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2E7D32', margin: 0 }}>
                AI 추천 수혜기관
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: '#1B5E20', marginBottom: '12px' }}>
              기부 품목의 위치와 특성을 고려하여 추천된 수혜기관입니다.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {beneficiaries
                .filter(b => aiRecommendations.includes(b.id))
                .map(beneficiary => (
                  <button
                    key={beneficiary.id}
                    onClick={() => handleSelectBeneficiary(beneficiary.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: selectedBeneficiaries.includes(beneficiary.id)
                        ? '2px solid #2E7D32'
                        : '1px solid #66BB6A',
                      backgroundColor: selectedBeneficiaries.includes(beneficiary.id)
                        ? '#2E7D32'
                        : 'white',
                      color: selectedBeneficiaries.includes(beneficiary.id)
                        ? 'white'
                        : '#2E7D32',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {beneficiary.organization_name} ✨
                  </button>
                ))
              }
            </div>
          </div>
        )}

        {/* 수혜 기관 선택 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
            수혜 기관 선택
          </h2>
          <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '16px' }}>
            하나 이상의 수혜 기관을 선택해주세요. (복수 선택 가능)
          </p>

          {beneficiaries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6C757D', padding: '40px' }}>
              승인된 수혜 기관이 없습니다.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {beneficiaries.map(beneficiary => (
                <div
                  key={beneficiary.id}
                  onClick={() => handleSelectBeneficiary(beneficiary.id)}
                  style={{
                    padding: '16px',
                    border: selectedBeneficiaries.includes(beneficiary.id) 
                      ? '2px solid #02391f' 
                      : '1px solid #DEE2E6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedBeneficiaries.includes(beneficiary.id)
                      ? '#F0F7F4'
                      : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#212529',
                        marginBottom: '4px',
                        display: 'block',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {beneficiary.organization_name}
                        {aiRecommendations.includes(beneficiary.id) && (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: '#E8F5E9',
                            color: '#2E7D32',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            marginLeft: '6px'
                          }}>
                            AI 추천
                          </span>
                        )}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6C757D', margin: '4px 0', wordBreak: 'break-word' }}>
                        {beneficiary.organization_type || '기타'} • {beneficiary.address}
                      </p>
                    </div>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: selectedBeneficiaries.includes(beneficiary.id)
                        ? '2px solid #02391f'
                        : '2px solid #DEE2E6',
                      backgroundColor: selectedBeneficiaries.includes(beneficiary.id)
                        ? '#02391f'
                        : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {selectedBeneficiaries.includes(beneficiary.id) && (
                        <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 수혜 기관 표시 */}
        {selectedBeneficiaries.length > 0 && (
          <p style={{ 
            fontSize: '14px', 
            color: '#28A745', 
            marginBottom: '24px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            ✅ {selectedBeneficiaries.length}개의 수혜 기관이 선택되었습니다.
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#6C757D',
              backgroundColor: 'white',
              border: '1px solid #DEE2E6',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedBeneficiaries.length === 0}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#212529',
              backgroundColor: '#ffd020',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting || selectedBeneficiaries.length === 0 ? 'not-allowed' : 'pointer',
              opacity: submitting || selectedBeneficiaries.length === 0 ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting && selectedBeneficiaries.length > 0) {
                e.currentTarget.style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && selectedBeneficiaries.length > 0) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            수혜기관 선정
          </button>
        </div>
      </div>
    </div>
  )
}