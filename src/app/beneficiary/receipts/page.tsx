'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const ReceiptTemplate = dynamic(() => import('./ReceiptTemplate'), { ssr: false })

interface ReceivedDonation {
  id: string
  status: string
  proposed_at: string
  responded_at: string | null
  received_at: string | null
  receipt_issued: boolean
  receipt_issued_at: string | null
  receipt_file_url: string | null
  donations: {
    id: string
    name: string
    description: string
    quantity: number
    unit: string
    pickup_deadline: string
    pickup_location: string
    photos?: string[]
    businesses: {
      name: string
      address: string
      representative_name: string
    }
  }
  quotes?: {
    id: string
    unit_price: number
    total_amount: number
    estimated_pickup_date: string
  }[]
}

export default function BeneficiaryReceiptsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [receivedDonations, setReceivedDonations] = useState<ReceivedDonation[]>([])
  const [beneficiary, setBeneficiary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // 현재 수혜기관 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: beneficiaryData } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (beneficiaryData) {
      setBeneficiary(beneficiaryData)
      
      // 수령 완료된 기부 목록 가져오기
      
      const { data: donationsData, error } = await supabase
        .from('donation_matches')
        .select(`
          *,
          donations (
            id,
            name,
            description,
            quantity,
            unit,
            status,
            pickup_deadline,
            pickup_location,
            photos,
            businesses (
              name,
              address,
              representative_name
            )
          )
        `)
        .eq('beneficiary_id', beneficiaryData.id)
        .eq('status', 'received')  // 수령 완료된 것만
        .order('received_at', { ascending: false, nullsFirst: false })
      
      if (error) {
        // Error fetching donations
      } else {
      }

      if (donationsData) {
        setReceivedDonations(donationsData)
      }
    }

    setLoading(false)
  }

  async function generateReceipt(donation: ReceivedDonation) {
    setGeneratingPdf(donation.id)
    
    try {
      console.log('Starting receipt generation for donation:', donation.id)
      
      // 필수 데이터 검증
      if (!donation.donations || !beneficiary) {
        throw new Error('필수 데이터가 누락되었습니다.')
      }
      
      // 임시 div에 ReceiptTemplate 렌더링
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '210mm'
      tempDiv.style.height = 'auto'
      document.body.appendChild(tempDiv)
      
      // React 컴포넌트를 렌더링하기 위한 루트 생성
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(tempDiv)
      
      console.log('Rendering ReceiptTemplate...')
      
      await new Promise<void>((resolve, reject) => {
        try {
          root.render(
            <ReceiptTemplate donation={donation} beneficiary={beneficiary} />
          )
          setTimeout(resolve, 800) // 렌더링 대기 시간 더 증가
        } catch (error) {
          reject(error)
        }
      })
      
      console.log('Waiting for receipt template element...')
      
      // 엘리먼트가 실제로 렌더링될 때까지 기다림
      let element = tempDiv.querySelector('#receipt-template') as HTMLElement
      let retries = 0
      while (!element && retries < 15) { // 재시도 횟수 증가
        await new Promise(resolve => setTimeout(resolve, 300))
        element = tempDiv.querySelector('#receipt-template') as HTMLElement
        retries++
        console.log(`Retry ${retries}: Looking for receipt template element...`)
      }
      
      if (!element) {
        console.error('Receipt template element not found after', retries, 'retries')
        console.log('Available elements in tempDiv:', tempDiv.innerHTML.substring(0, 200))
        throw new Error('Receipt template not found')
      }
      
      console.log('Receipt template element found, generating canvas...')
      
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
      pdf.save(`기부영수증_${donation.donations?.businesses?.name || '기부'}_${new Date().toISOString().split('T')[0]}.pdf`)
      
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
        .eq('id', donation.id)
      
      alert('기부영수증이 발행되었습니다.')
      fetchData()
    } catch (error) {
      console.error('Error generating receipt:', error)
      alert(`영수증 발행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setGeneratingPdf(null)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .main-container {
            padding: 16px !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-table {
            display: block !important;
          }
          .mobile-cards {
            display: none !important;
          }
        }
      `}} />
      
      <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }} className="main-container">
          <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
            기부 수령 내역
          </h1>

          {receivedDonations.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '80px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <p style={{ color: '#6C757D', fontSize: '16px' }}>
                아직 수령한 기부가 없습니다.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch'
              }} className="desktop-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기업명</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업예정일</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>상태</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedDonations.map((donation) => {
                      const isReceived = donation.status === 'received'
                      const hasReceipt = donation.receipt_issued
                      
                      return (
                        <tr key={donation.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                            {donation.donations?.name || donation.donations?.description || '-'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                            {donation.donations?.businesses?.name || '-'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                            {donation.donations?.quantity || 0}{donation.donations?.unit || 'kg'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                            {donation.donations?.pickup_deadline ? new Date(donation.donations.pickup_deadline).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                              <span style={{
                                color: '#007BFF',
                                fontWeight: '500',
                                fontSize: '12px',
                                backgroundColor: '#007BFF20',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                수령 완료
                              </span>
                              {hasReceipt && (
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#28A745', 
                                  fontWeight: '500',
                                  backgroundColor: '#28A74520',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block'
                                }}>
                                  영수증 발급 완료
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {!hasReceipt ? (
                              <button
                                onClick={() => generateReceipt(donation)}
                                disabled={generatingPdf === donation.id}
                                style={{
                                  padding: '6px 16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: 'white',
                                  backgroundColor: generatingPdf === donation.id ? '#6C757D' : '#02391f',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: generatingPdf === donation.id ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  minWidth: '90px'
                                }}
                              >
                                {generatingPdf === donation.id ? '생성 중...' : '영수증 발급'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#6C757D' }}>
                                발급 완료
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card Layout */}
              <div className="mobile-cards" style={{ display: 'none' }}>
                {receivedDonations.map((donation) => {
                  const isReceived = donation.status === 'received'
                  const hasReceipt = donation.receipt_issued
                  
                  return (
                    <div key={donation.id} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      border: '1px solid #E9ECEF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          backgroundColor: '#F8F9FA',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #DEE2E6',
                          flexShrink: 0
                        }}>
                          {donation.donations?.photos && donation.donations.photos[0] ? (
                            <img 
                              src={donation.donations.photos[0]} 
                              alt="기부 물품" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ADB5BD'
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px', wordBreak: 'break-word' }}>
                            {donation.donations?.name || donation.donations?.description || '-'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
                            기업: {donation.donations?.businesses?.name || '-'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              color: '#007BFF',
                              fontWeight: '500',
                              fontSize: '12px',
                              backgroundColor: '#007BFF20',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              수령 완료
                            </span>
                            {hasReceipt && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#28A745', 
                                fontWeight: '500',
                                backgroundColor: '#28A74520',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                영수증 발급 완료
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>수량</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {donation.donations?.quantity || 0}{donation.donations?.unit || 'kg'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>픽업예정일</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {donation.donations?.pickup_deadline ? new Date(donation.donations.pickup_deadline).toLocaleDateString('ko-KR') : '-'}
                          </div>
                        </div>
                      </div>
                      
                      {donation.donations?.pickup_location && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>픽업장소</span>
                          <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                            {donation.donations.pickup_location}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!hasReceipt ? (
                          <button
                            onClick={() => generateReceipt(donation)}
                            disabled={generatingPdf === donation.id}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: generatingPdf === donation.id ? '#6C757D' : '#02391f',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: generatingPdf === donation.id ? 'not-allowed' : 'pointer',
                              flex: 1
                            }}
                          >
                            {generatingPdf === donation.id ? '생성 중...' : '영수증 발급'}
                          </button>
                        ) : (
                          <div style={{ 
                            padding: '8px 16px',
                            fontSize: '13px',
                            color: '#6C757D',
                            backgroundColor: '#F8F9FA',
                            borderRadius: '4px',
                            textAlign: 'center',
                            flex: 1
                          }}>
                            발급 완료
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}