'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface DonationWithReceipt {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  status: string
  created_at: string
  completed_at: string | null
  donation_matches: {
    id: string
    beneficiary_id: string
    status: string
    received_at: string | null
    receipt_issued: boolean
    receipt_issued_at: string | null
    receipt_file_url: string | null
    beneficiaries: {
      organization_name: string
      representative_name: string
      phone: string
      address: string
    }
  }[]
}

export default function BusinessReceiptsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [donations, setDonations] = useState<DonationWithReceipt[]>([])
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // 현재 기업 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (businessData) {
      setBusiness(businessData)
      
      // 완료된 기부와 영수증 정보 가져오기
      const { data: donationsData, error } = await supabase
        .from('donations')
        .select(`
          *,
          donation_matches (
            id,
            beneficiary_id,
            status,
            received_at,
            receipt_issued,
            receipt_issued_at,
            receipt_file_url,
            beneficiaries (
              organization_name,
              representative_name,
              phone,
              address
            )
          )
        `)
        .eq('business_id', businessData.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false, nullsFirst: false })
      
      if (error) {
        console.error('Error fetching donations:', error)
      }

      if (donationsData) {
        // 영수증이 발급된 기부만 필터링
        const donationsWithReceipts = donationsData.filter(donation => 
          donation.donation_matches?.some((match: any) => 
            match.status === 'received' && match.receipt_issued
          )
        )
        setDonations(donationsWithReceipts)
      }
    }

    setLoading(false)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  async function downloadReceipt(matchId: string, businessName: string, beneficiaryName: string) {
    // 영수증 파일 URL이 있다면 다운로드 처리
    // 현재는 PDF가 donation_matches 테이블에 저장되지 않으므로
    // 추후 구현 필요
    alert('영수증 다운로드 기능은 준비 중입니다.')
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
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }} className="main-container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
            기부 영수증 조회
          </h1>
          <p style={{ fontSize: '14px', color: '#6C757D' }}>
            기부가 완료되고 수혜기관이 영수증을 발급한 내역을 확인할 수 있습니다.
          </p>
        </div>

        {donations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>
              아직 발급된 영수증이 없습니다.
            </p>
            <p style={{ color: '#ADB5BD', fontSize: '14px', marginTop: '8px' }}>
              기부가 완료되고 수혜기관이 물품을 수령한 후 영수증이 발급됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch'
            }} className="desktop-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기부일자</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품목명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수혜기관</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수령일자</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>영수증 발급일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => {
                  // 영수증이 발급된 매칭만 표시
                  const receiptMatches = donation.donation_matches?.filter((match: any) => 
                    match.status === 'received' && match.receipt_issued
                  ) || []
                  
                  return receiptMatches.map((match: any) => (
                    <tr key={`${donation.id}-${match.id}`} style={{ borderBottom: '1px solid #DEE2E6' }}>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {formatDate(donation.created_at)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{donation.name || '-'}</div>
                          {donation.description && (
                            <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '2px' }}>
                              {donation.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {donation.quantity}{donation.unit || 'kg'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {match.beneficiaries?.organization_name || '-'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '2px' }}>
                            {match.beneficiaries?.representative_name || ''}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {formatDate(match.received_at)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                        {formatDate(match.receipt_issued_at)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              // 영수증 상세 보기
                              alert('영수증 상세 보기 기능은 준비 중입니다.')
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#02391f',
                              backgroundColor: 'white',
                              border: '1px solid #02391f',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            조회
                          </button>
                          <button
                            onClick={() => downloadReceipt(
                              match.id,
                              business?.name || '',
                              match.beneficiaries?.organization_name || ''
                            )}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#02391f',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            다운로드
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="mobile-cards" style={{ display: 'none' }}>
              {donations.map((donation) => {
                // 영수증이 발급된 매칭만 표시
                const receiptMatches = donation.donation_matches?.filter((match: any) => 
                  match.status === 'received' && match.receipt_issued
                ) || []
                
                return receiptMatches.map((match: any) => (
                  <div key={`${donation.id}-${match.id}`} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid #E9ECEF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    {/* 상단: 기본 정보 */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                        {donation.name || '-'}
                      </div>
                      {donation.description && (
                        <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
                          {donation.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: '#28A745',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: '#28A74520',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          영수증 발급 완료
                        </span>
                      </div>
                    </div>

                    {/* 중간: 상세 정보 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>수량</span>
                        <div style={{ fontWeight: '500', color: '#212529' }}>
                          {donation.quantity}{donation.unit || 'kg'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>기부일자</span>
                        <div style={{ fontWeight: '500', color: '#212529' }}>
                          {formatDate(donation.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#6C757D', fontSize: '12px' }}>수혜기관</span>
                      <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                        {match.beneficiaries?.organization_name || '-'}
                      </div>
                      {match.beneficiaries?.representative_name && (
                        <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '2px' }}>
                          대표자: {match.beneficiaries.representative_name}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>수령일자</span>
                        <div style={{ fontWeight: '500', color: '#212529' }}>
                          {formatDate(match.received_at)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>영수증 발급일</span>
                        <div style={{ fontWeight: '500', color: '#212529' }}>
                          {formatDate(match.receipt_issued_at)}
                        </div>
                      </div>
                    </div>

                    {/* 하단: 액션 버튼들 */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          // 영수증 상세 보기
                          alert('영수증 상세 보기 기능은 준비 중입니다.')
                        }}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#02391f',
                          backgroundColor: 'white',
                          border: '1px solid #02391f',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        조회
                      </button>
                      <button
                        onClick={() => downloadReceipt(
                          match.id,
                          business?.name || '',
                          match.beneficiaries?.organization_name || ''
                        )}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: '#02391f',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        다운로드
                      </button>
                    </div>
                  </div>
                ))
              })}
            </div>
          </>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#E7F5FF',
          borderLeft: '4px solid #339AF0',
          borderRadius: '4px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1971C2' }}>
            안내사항
          </h3>
          <ul style={{ fontSize: '13px', color: '#1864AB', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>영수증은 수혜기관이 물품을 수령한 후 발급됩니다.</li>
            <li>발급된 영수증은 세금 공제 등의 용도로 활용할 수 있습니다.</li>
            <li>영수증 관련 문의는 각 수혜기관으로 연락 바랍니다.</li>
          </ul>
        </div>
        </div>
      </div>
    </>
  )
}