'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const ReceiptTemplate = dynamic(() => import('@/app/beneficiary/receipts/ReceiptTemplate'), { ssr: false })

interface ProposalDetail {
  id: string
  status: string
  proposed_at: string
  responded_at: string | null
  response_notes: string | null
  donations: {
    id: string
    description: string
    quantity: number
    unit: string
    pickup_deadline: string
    pickup_location: string
    photos: string[] | null
    businesses: {
      name: string
      address: string
      phone: string
      representative_name: string
      email: string
    }
  }
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const proposalId = params.id as string
  const supabase = createClient()
  
  const [proposal, setProposal] = useState<ProposalDetail | null>(null)
  const [beneficiary, setBeneficiary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [acceptedQuantity, setAcceptedQuantity] = useState<number>(0)
  const [remainingQuantity, setRemainingQuantity] = useState<number>(0)

  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  async function fetchProposal() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }


      // Get beneficiary info
      const { data: beneficiaryData, error: beneficiaryError } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (beneficiaryError) {
        // Error fetching beneficiary
      } else if (beneficiaryData) {
        setBeneficiary(beneficiaryData)
      }

      // Get proposal details - simplified query first
      const { data, error } = await supabase
        .from('donation_matches')
        .select('*')
        .eq('id', proposalId)
        .single()


      if (!error && data) {
        // Get donation details
        const { data: donationData, error: donationError } = await supabase
          .from('donations')
          .select(`
            *,
            businesses (*)
          `)
          .eq('id', data.donation_id)
          .single()


        if (donationData) {
          // Combine the data
          const proposalWithDetails = {
            ...data,
            donations: donationData,
            quotes: []
          }

          // Get quotes if needed
          const { data: quotes } = await supabase
            .from('quotes')
            .select('*')
            .eq('donation_id', data.donation_id)
            .order('created_at', { ascending: false })
          
          if (quotes) {
            proposalWithDetails.quotes = quotes
          }

          setProposal(proposalWithDetails)
          setNotes(data.response_notes || '')
          
          // Calculate remaining quantity
          const { data: otherMatches } = await supabase
            .from('donation_matches')
            .select('accepted_quantity')
            .eq('donation_id', data.donation_id)
            .in('status', ['accepted', 'received', 'quote_sent'])
            .not('id', 'eq', proposalId)
          
          const totalAcceptedByOthers = otherMatches?.reduce((sum, match) => 
            sum + (match.accepted_quantity || 0), 0) || 0
          
          const remaining = donationData.quantity - totalAcceptedByOthers
          setRemainingQuantity(remaining)
          setAcceptedQuantity(Math.min(remaining, donationData.quantity))
        }
      } else if (error) {
        // Error fetching proposal
      }
    } catch (err) {
      // Unexpected error
    } finally {
      setLoading(false)
    }
  }

  async function handleResponse(accept: boolean) {
    if (!proposal) return

    // Validate accepted quantity
    if (accept && (acceptedQuantity <= 0 || acceptedQuantity > remainingQuantity)) {
      alert(`수령 가능한 수량은 1 ~ ${remainingQuantity}${proposal.donations.unit || 'kg'} 입니다.`)
      return
    }

    setSubmitting(true)

    const updateData: any = {
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
      response_notes: notes || null
    }
    
    if (accept) {
      updateData.accepted_quantity = acceptedQuantity
      updateData.accepted_unit = proposal.donations.unit || 'kg'
    }

    const { error } = await supabase
      .from('donation_matches')
      .update(updateData)
      .eq('id', proposalId)

    if (!error && accept) {
      // Update the donation's remaining quantity
      await supabase
        .from('donations')
        .update({
          remaining_quantity: remainingQuantity - acceptedQuantity
        })
        .eq('id', proposal.donations.id)
    }

    if (error) {
      alert('응답 처리 중 오류가 발생했습니다.')
    } else {
      alert(accept ? `${acceptedQuantity}${proposal.donations.unit || 'kg'} 수락했습니다.` : '제안을 거절했습니다.')
      router.push('/beneficiary/proposals')
    }

    setSubmitting(false)
  }


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (!proposal) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>제안 정보를 찾을 수 없습니다.</div>
  }

  const donation = proposal.donations
  const business = donation?.businesses

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          제안 상세 정보
        </h1>

        {/* 기부 정보 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
            기부 물품 정보
          </h2>

          {donation.photos && donation.photos.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {donation.photos.map((photo, idx) => (
                  <img 
                    key={idx}
                    src={photo} 
                    alt={`${(donation as any).name || donation.description} - 사진 ${idx + 1}`}
                    style={{ 
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #E9ECEF'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                품명
              </label>
              <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>{(donation as any).name || donation.description}</p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                수량
              </label>
              <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                {donation.quantity}{donation.unit || 'kg'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                픽업 희망일
              </label>
              <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                픽업 장소
              </label>
              <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                {donation.pickup_location}
              </p>
            </div>
            {donation.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                  상세 설명
                </label>
                <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                  {donation.description}
                </p>
              </div>
            )}
          </div>
        </div>


        {/* 응답 섹션 */}
        {proposal.status === 'proposed' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              제안 응답
            </h2>
            
            {/* 수량 선택 섹션 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                수령 희망 수량
              </label>
              <div style={{ 
                backgroundColor: '#F8F9FA', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '12px' }}>
                  전체 수량: {donation.quantity}{donation.unit || 'kg'} | 
                  남은 수량: {remainingQuantity}{donation.unit || 'kg'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min="1"
                    max={remainingQuantity}
                    value={acceptedQuantity}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      if (value >= 0 && value <= remainingQuantity) {
                        setAcceptedQuantity(value)
                      }
                    }}
                    style={{
                      width: '120px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#02391f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#CED4DA'}
                  />
                  <span style={{ fontSize: '16px', color: '#212529' }}>
                    {donation.unit || 'kg'}
                  </span>
                  {remainingQuantity < donation.quantity && (
                    <span style={{ fontSize: '12px', color: '#FF8C00', marginLeft: 'auto' }}>
                      * 다른 기관이 이미 {donation.quantity - remainingQuantity}{donation.unit || 'kg'}를 수령 예정입니다
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                응답 메모 (선택사항)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="거절 사유나 추가 요청사항을 입력해주세요"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  minHeight: '100px',
                  resize: 'vertical',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#02391f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#CED4DA'}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => handleResponse(false)}
                disabled={submitting}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#DC3545',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#C82333')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#DC3545')}
              >
                {submitting ? '처리 중...' : '거절'}
              </button>
              <button
                onClick={() => handleResponse(true)}
                disabled={submitting}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#28A745',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#218838')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#28A745')}
              >
                {submitting ? '처리 중...' : '수락'}
              </button>
            </div>
          </div>
        )}

        {/* 응답 결과 표시 */}
        {proposal.status !== 'proposed' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              응답 결과
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                상태
              </label>
              <span style={{ 
                color: proposal.status === 'accepted' ? '#28A745' : 
                      proposal.status === 'received' ? '#17A2B8' : '#DC3545',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {proposal.status === 'accepted' ? '수락됨' : 
                 proposal.status === 'received' ? '기부완료' : '거절됨'}
              </span>
            </div>
            {proposal.responded_at && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                  응답일
                </label>
                <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                  {new Date(proposal.responded_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
            {proposal.response_notes && (
              <div>
                <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                  응답 메모
                </label>
                <p style={{ fontSize: '16px', color: '#212529', margin: 0 }}>
                  {proposal.response_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 픽업 일정 및 수령 확인 섹션 */}
        {proposal.status === 'quote_sent' && (donation as any).status === 'pickup_scheduled' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              픽업 일정
            </h2>
            <div style={{ 
              backgroundColor: '#E8F5E9', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '24px' 
            }}>
              <p style={{ fontSize: '16px', color: '#2E7D32', marginBottom: '8px' }}>
                <strong>픽업 예정일:</strong> {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
              </p>
              <p style={{ fontSize: '14px', color: '#388E3C' }}>
                <strong>픽업 장소:</strong> {donation.pickup_location}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={async () => {
                  if (confirm('물품을 수령하셨습니까?')) {
                    await supabase
                      .from('donation_matches')
                      .update({ 
                        status: 'received',
                        received_at: new Date().toISOString()
                      })
                      .eq('id', proposalId)
                    
                    await supabase
                      .from('donations')
                      .update({ 
                        status: 'completed',
                        completed_at: new Date().toISOString()
                      })
                      .eq('id', donation.id)
                    
                    alert('수령이 완료되었습니다. 기부영수증을 발급해주세요.')
                    fetchProposal()
                  }
                }}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#28A745',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28A745'}
              >
                수령 완료
              </button>
            </div>
          </div>
        )}

        {/* 기부영수증 발급 섹션 */}
        {proposal.status === 'received' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              기부영수증 발급
            </h2>
            <div style={{ 
              backgroundColor: '#F0F7F4', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '24px' 
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#02391f' }}>
                영수증 정보
              </h3>
              <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
                <p><strong>기부물품:</strong> {(donation as any).name || donation.description}</p>
                <p><strong>수량:</strong> {donation.quantity}{donation.unit}</p>
                <p><strong>수령일:</strong> {new Date().toLocaleDateString('ko-KR')}</p>
              </div>
              <p style={{ fontSize: '12px', color: '#6C757D', marginTop: '16px' }}>
                * 영수증 발급 버튼을 클릭하면 기부가 완료 처리됩니다.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={async () => {
                  if (confirm('기부영수증을 발급하시겠습니까?')) {
                    setGeneratingPdf(true)
                    
                    try {
                      // 임시 div에 ReceiptTemplate 렌더링
                      const tempDiv = document.createElement('div')
                      tempDiv.style.position = 'absolute'
                      tempDiv.style.left = '-9999px'
                      tempDiv.style.top = '0'
                      document.body.appendChild(tempDiv)
                      
                      // React 컴포넌트를 렌더링하기 위한 루트 생성
                      const { createRoot } = await import('react-dom/client')
                      const root = createRoot(tempDiv)
                      
                      // donation_matches 데이터에 quotes 정보 추가
                      const donationWithQuotes = {
                        ...proposal,
                        quotes: (proposal as any).quotes || []
                      }
                      
                      await new Promise<void>((resolve) => {
                        root.render(
                          <ReceiptTemplate donation={donationWithQuotes} beneficiary={beneficiary} />
                        )
                        setTimeout(resolve, 100) // 렌더링 대기
                      })
                      
                      const element = tempDiv.querySelector('#receipt-template') as HTMLElement
                      if (!element) throw new Error('Receipt template not found')
                      
                      // HTML을 캔버스로 변환
                      const canvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                      })
                      
                      // PDF 생성
                      const imgWidth = 210
                      const pageHeight = 297
                      const imgHeight = (canvas.height * imgWidth) / canvas.width
                      let heightLeft = imgHeight
                      
                      const pdf = new jsPDF('p', 'mm', 'a4')
                      let position = 0
                      
                      const imgData = canvas.toDataURL('image/png')
                      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                      heightLeft -= pageHeight
                      
                      while (heightLeft >= 0) {
                        position = heightLeft - imgHeight
                        pdf.addPage()
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                        heightLeft -= pageHeight
                      }
                      
                      // PDF 저장
                      pdf.save(`기부영수증_${new Date().toISOString().split('T')[0]}.pdf`)
                      
                      // 정리
                      root.unmount()
                      document.body.removeChild(tempDiv)
                      
                      // 상태 업데이트 (영수증 발행 완료)
                      await supabase
                        .from('donation_matches')
                        .update({ 
                          receipt_issued: true,
                          receipt_issued_at: new Date().toISOString()
                        })
                        .eq('id', proposalId)
                      
                      alert('기부영수증이 발행되었습니다.')
                      router.push('/beneficiary/proposals')
                    } catch (error) {
                      alert('영수증 발행 중 오류가 발생했습니다.')
                    } finally {
                      setGeneratingPdf(false)
                    }
                  }
                }}
                disabled={generatingPdf}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: generatingPdf ? '#6C757D' : '#02391f',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: generatingPdf ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: generatingPdf ? 0.7 : 1
                }}
                onMouseEnter={(e) => !generatingPdf && (e.currentTarget.style.backgroundColor = '#164137')}
                onMouseLeave={(e) => !generatingPdf && (e.currentTarget.style.backgroundColor = '#02391f')}
              >
                {generatingPdf ? 'PDF 생성 중...' : '기부영수증 발급하기'}
              </button>
            </div>
          </div>
        )}

        {/* 뒤로가기 버튼 */}
        <div style={{ textAlign: 'center' }}>
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
            목록으로
          </button>
        </div>
      </div>
    </div>
  )
}