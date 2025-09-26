'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DonationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [donation, setDonation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const donationId = params.id

  useEffect(() => {
    if (donationId) {
      console.log('Component mounted with donation ID:', donationId)
      fetchDonationDetail()
    }
  }, [donationId])

  async function fetchDonationDetail() {
    try {
      console.log('Fetching donation detail for ID:', donationId)
      
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          businesses (
            id,
            name,
            manager_name,
            manager_phone,
            address,
            postcode,
            detail_address
          ),
          donation_matches (
            *,
            beneficiaries (
              id,
              organization_name,
              representative_name,
              phone,
              address,
              postcode,
              detail_address
            ),
            quotes (
              *
            )
          )
        `)
        .eq('id', donationId)
        .single()

      if (error) {
        console.error('Error fetching donation detail:', error)
        // If complex query fails, try simpler query
        const { data: simpleDonation, error: simpleError } = await supabase
          .from('donations')
          .select('*')
          .eq('id', donationId)
          .single()
        
        if (simpleDonation) {
          console.log('Simple donation fetched:', simpleDonation)
          // Fetch business info separately
          if (simpleDonation.business_id) {
            const { data: business } = await supabase
              .from('businesses')
              .select('*')
              .eq('id', simpleDonation.business_id)
              .single()
            
            if (business) {
              simpleDonation.businesses = business
            }
          }
          
          // Fetch donation matches separately
          const { data: matches } = await supabase
            .from('donation_matches')
            .select(`
              *,
              beneficiaries (*)
            `)
            .eq('donation_id', donationId)
          
          if (matches) {
            simpleDonation.donation_matches = matches
          }
          
          setDonation(simpleDonation)
        } else {
          console.error('Simple query also failed:', simpleError)
        }
      } else {
        console.log('Donation data fetched successfully:', data)
        setDonation(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>기부 정보를 찾을 수 없습니다.</div>
  }

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'pending_review': { text: '검토 대기', color: '#FFC107' },
      'matched': { text: '매칭 완료', color: '#17A2B8' },
      'quote_sent': { text: '견적서 발송', color: '#007BFF' },
      'quote_accepted': { text: '견적 승인', color: '#28A745' },
      'pickup_scheduled': { text: '픽업 예정', color: '#6F42C1' },
      'completed': { text: '기부 완료', color: '#28A745' },
      'rejected': { text: '거절됨', color: '#DC3545' }
    }
    return statusMap[status] || { text: status, color: '#6C757D' }
  }

  const status = getStatusBadge(donation.status)

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
            기부 상세 정보
          </h1>
          <Link href="/admin/donations">
            <button style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6C757D',
              backgroundColor: 'white',
              border: '1px solid #DEE2E6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              목록으로
            </button>
          </Link>
        </div>

        {/* 기부 기본 정보 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
            기부 정보
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                상태
              </label>
              <span style={{
                color: status.color,
                fontWeight: '500',
                fontSize: '14px',
                backgroundColor: status.color + '20',
                padding: '4px 12px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {status.text}
              </span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                등록일
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {new Date(donation.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                물품명
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {donation.name}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                수량
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {donation.quantity} {donation.unit}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                카테고리
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {donation.category || '-'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                픽업 마감일
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                픽업 장소
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {donation.pickup_location}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                픽업 시간
              </label>
              <div style={{ fontSize: '14px', color: '#212529' }}>
                {donation.pickup_time || '-'}
              </div>
            </div>
            {donation.expiration_date && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  소비기한
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.expiration_date}
                </div>
              </div>
            )}
            {donation.direct_delivery_available !== undefined && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  직접 배달
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.direct_delivery_available ? '가능' : '불가'}
                </div>
              </div>
            )}
          </div>
          {donation.additional_info && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                추가 정보
              </label>
              <div style={{ fontSize: '14px', color: '#212529', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '4px' }}>
                {donation.additional_info}
              </div>
            </div>
          )}
          {donation.product_detail_url && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                제품 상세정보 링크
              </label>
              <a href={donation.product_detail_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#007BFF' }}>
                {donation.product_detail_url}
              </a>
            </div>
          )}
        </div>

        {/* 기부 사진 */}
        {donation.photos && donation.photos.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              기부 물품 사진
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {donation.photos.map((photo: string, index: number) => (
                <img
                  key={index}
                  src={photo}
                  alt={`기부 물품 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #DEE2E6'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 기부 기업 정보 */}
        {donation.businesses && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              기부 기업 정보
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  기업명
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.businesses.name}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  담당자
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.businesses.manager_name}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  연락처
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.businesses.manager_phone}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                  주소
                </label>
                <div style={{ fontSize: '14px', color: '#212529' }}>
                  {donation.businesses.address} {donation.businesses.detail_address}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 매칭된 수혜기관 정보 */}
        {donation.donation_matches && donation.donation_matches.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#212529' }}>
              매칭된 수혜기관 정보
            </h2>
            {donation.donation_matches.map((match: any, index: number) => (
              <div key={match.id} style={{ 
                padding: '16px', 
                backgroundColor: '#F8F9FA', 
                borderRadius: '8px',
                marginBottom: index < donation.donation_matches.length - 1 ? '16px' : '0'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                      기관명
                    </label>
                    <div style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                      {match.beneficiaries?.organization_name}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                      대표자
                    </label>
                    <div style={{ fontSize: '14px', color: '#212529' }}>
                      {match.beneficiaries?.representative_name}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                      연락처
                    </label>
                    <div style={{ fontSize: '14px', color: '#212529' }}>
                      {match.beneficiaries?.phone}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                      수령 수량
                    </label>
                    <div style={{ fontSize: '14px', color: '#212529' }}>
                      {match.accepted_quantity} {donation.unit}
                    </div>
                  </div>
                </div>
                
                {/* 견적서 정보 */}
                {match.quotes && match.quotes.length > 0 && (
                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid #DEE2E6' 
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#495057' }}>
                      견적서 정보
                    </h3>
                    {match.quotes.map((quote: any) => (
                      <div key={quote.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6C757D', marginBottom: '4px' }}>
                            배송비
                          </label>
                          <div style={{ fontSize: '13px', color: '#212529' }}>
                            {quote.delivery_fee?.toLocaleString()}원
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6C757D', marginBottom: '4px' }}>
                            픽업 예정일
                          </label>
                          <div style={{ fontSize: '13px', color: '#212529' }}>
                            {quote.pickup_date ? new Date(quote.pickup_date).toLocaleDateString('ko-KR') : '-'}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6C757D', marginBottom: '4px' }}>
                            픽업 시간
                          </label>
                          <div style={{ fontSize: '13px', color: '#212529' }}>
                            {quote.pickup_time || '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}