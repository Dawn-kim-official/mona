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
      console.log('Fetching donations for beneficiary:', beneficiaryData.id)
      
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
        console.error('Error fetching donations:', error)
      } else {
        console.log('Fetched donations:', donationsData)
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
      // 임시 div에 ReceiptTemplate 렌더링
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      document.body.appendChild(tempDiv)
      
      // React 컴포넌트를 렌더링하기 위한 루트 생성
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(tempDiv)
      
      await new Promise<void>((resolve) => {
        root.render(
          <ReceiptTemplate donation={donation} beneficiary={beneficiary} />
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
      alert('영수증 발행 중 오류가 발생했습니다.')
    } finally {
      setGeneratingPdf(null)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          기부 수령 내역
        </h1>

        {receivedDonations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>
              아직 수령한 기부가 없습니다.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기부기업</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품목</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업예정일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업장소</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>상태</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {receivedDonations.map((donation) => {
                  const isReceived = donation.status === 'received'
                  const hasReceipt = donation.receipt_issued
                  
                  return (
                    <tr key={donation.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.donations?.businesses?.name || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.donations?.name || donation.donations?.description || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.donations?.quantity || 0}{donation.donations?.unit || 'kg'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.donations?.pickup_deadline ? new Date(donation.donations.pickup_deadline).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.donations?.pickup_location || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          backgroundColor: isReceived ? '#D4EDDA' : '#FFF3CD',
                          color: isReceived ? '#155724' : '#856404'
                        }}>
                          {isReceived ? '수령 완료' : '수령 대기'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {!isReceived ? (
                          <button
                            onClick={async () => {
                              if (confirm('물품을 수령하셨습니까?')) {
                                await supabase
                                  .from('donation_matches')
                                  .update({ 
                                    status: 'received',
                                    received_at: new Date().toISOString()
                                  })
                                  .eq('id', donation.id)
                                
                                await supabase
                                  .from('donations')
                                  .update({ 
                                    status: 'completed',
                                    completed_at: new Date().toISOString()
                                  })
                                  .eq('id', donation.donations.id)
                                
                                alert('수령이 완료되었습니다.')
                                fetchData()
                              }
                            }}
                            style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#28A745',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            수령 완료
                          </button>
                        ) : !hasReceipt ? (
                          <button
                            onClick={() => generateReceipt(donation)}
                            disabled={generatingPdf === donation.id}
                            style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: generatingPdf === donation.id ? '#6C757D' : '#1B4D3E',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: generatingPdf === donation.id ? 'not-allowed' : 'pointer'
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
        )}
      </div>
    </div>
  )
}