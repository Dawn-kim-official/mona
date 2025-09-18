'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QuoteDetailModal from '@/components/QuoteDetailModal'

type Donation = Database['public']['Tables']['donations']['Row']
type Quote = Database['public']['Tables']['quotes']['Row']

const statusMap: { [key: string]: { text: string; color: string } } = {
  'pending_review': { text: '승인 대기', color: '#FF8C00' },
  'rejected': { text: '승인 거절', color: '#DC3545' },
  'beneficiary_selected': { text: '수혜기관 선정', color: '#17A2B8' },
  'quote_sent': { text: '견적 대기', color: '#FF8C00' },
  'quote_accepted': { text: '견적 대기', color: '#FF8C00' },
  'matched': { text: '견적 대기', color: '#FF8C00' },
  'pickup_scheduled': { text: '견적 수락', color: '#007BFF' },
  'completed': { text: '픽업 완료', color: '#28A745' }
}

const tabs = [
  { id: '전체', label: '전체' },
  { id: '승인 대기', label: '승인 대기' },
  { id: '승인 거절', label: '승인 거절' },
  { id: '수혜기관 선정', label: '수혜기관 선정' },
  { id: '견적 대기', label: '견적 대기' },
  { id: '견적 수락', label: '견적 수락' },
  { id: '견적 거절', label: '견적 거절' },
  { id: '기부 완료', label: '기부 완료' }
]

export default function BusinessDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('전체')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  useEffect(() => {
    fetchDonations()
  }, [])

  async function fetchDonations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) return

    setBusinessId(business.id)

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Error fetching donations
    } else {
      setDonations(data || [])
    }
    setLoading(false)
  }

  async function handleViewQuote(donationId: string) {
    // Find the donation
    const donation = donations.find(d => d.id === donationId)
    if (!donation) return

    // Fetch the quote for this donation
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('donation_id', donationId)
      .single()

    if (error) {
      // Error fetching quote
      return
    }

    setSelectedDonation(donation)
    setSelectedQuote(quote)
    setShowQuoteModal(true)
  }


  async function handleAcceptQuote(quoteId: string) {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId)

    if (!error && selectedDonation) {
      // Navigate to pickup scheduling page
      router.push(`/business/donation/${selectedDonation.id}/pickup-schedule`)
    }

    setShowQuoteModal(false)
    setSelectedQuote(null)
    setSelectedDonation(null)
  }

  async function handleRejectQuote(quoteId: string) {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('id', quoteId)

    if (!error && selectedDonation) {
      // Update donation status back to pending_review
      await supabase
        .from('donations')
        .update({ status: 'pending_review' })
        .eq('id', selectedDonation.id)

      // Refresh donations
      await fetchDonations()
    }

    setShowQuoteModal(false)
    setSelectedQuote(null)
    setSelectedDonation(null)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const filteredDonations = activeTab === '전체' 
    ? donations 
    : donations.filter(donation => {
        switch(activeTab) {
          case '승인 대기': return donation.status === 'pending_review';
          case '승인 거절': return (donation.status as any) === 'rejected';
          case '수혜기관 선정': return (donation.status as any) === 'beneficiary_selected';
          case '견적 대기': return donation.status === 'quote_sent' || donation.status === 'matched' || donation.status === 'quote_accepted';
          case '견적 수락': return donation.status === 'pickup_scheduled';
          case '견적 거절': return false;
          case '기부 완료': return donation.status === 'completed';
          default: return true;
        }
      });

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      {/* Main Content Container */}
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Tab Navigation */}
        <div style={{ 
          backgroundColor: '#FFFFFF',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', height: '48px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #02391f' : '2px solid transparent',
                  padding: '0 24px',
                  fontSize: '14px',
                  color: activeTab === tab.id ? '#02391f' : '#6C757D',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#495057';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#6C757D';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link href="/business/donation/new">
            <button style={{ 
              backgroundColor: '#ffd020', 
              color: '#212529', 
              padding: '8px 20px', 
              border: 'none', 
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              margin: '8px',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            >
              <span style={{ fontSize: '18px', lineHeight: '1' }}>⊕</span>
              새 기부 등록
            </button>
          </Link>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#212529', fontWeight: '600' }}>내 기부 목록</h1>
          <p style={{ color: '#6C757D', fontSize: '14px' }}>등록하신 기부 내역을 확인하고 관리할 수 있습니다.</p>
        </div>

        {filteredDonations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px', 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px', marginBottom: donations.length === 0 ? '24px' : '0' }}>
              {donations.length === 0 
                ? '등록된 기부가 없습니다.' 
                : activeTab === '전체' 
                  ? '등록된 기부가 없습니다.'
                  : `${activeTab} 상태의 기부가 없습니다.`}
            </p>
            {/* 전체 기부 이력이 없을 때만 첫 기부 등록하기 버튼 표시 */}
            {donations.length === 0 && (
              <Link href="/business/donation/new">
                <button style={{ 
                  backgroundColor: '#ffd020', 
                  color: '#212529', 
                  padding: '10px 24px', 
                  border: 'none', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  첫 기부 등록하기
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '80px' }}>이미지</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '100px' }}>등록일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '80px' }}>수량</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '120px' }}>픽업희망일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '120px' }}>상태</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '150px' }}>작업</th>
                </tr>
              </thead>
            <tbody>
              {filteredDonations.map((donation) => {
                const status = statusMap[donation.status] || { text: donation.status, color: '#666' }
                return (
                    <tr key={donation.id} style={{ 
                      borderBottom: '1px solid #DEE2E6',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => router.push(`/business/donation/${donation.id}`)}
                    >
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          backgroundColor: '#F8F9FA',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #DEE2E6',
                          margin: '0 auto'
                        }}>
                          {donation.photos && donation.photos[0] ? (
                            <img 
                              src={donation.photos[0]} 
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
                              color: '#adb5bd'
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#212529', textAlign: 'center' }}>{donation.description}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#495057', textAlign: 'center' }}>{new Date(donation.created_at).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#212529', textAlign: 'center' }}>{donation.quantity}{(donation as any).unit || 'kg'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#495057', textAlign: 'center' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          color: status.color,
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: status.color + '20',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {status.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {donation.status === 'quote_sent' && (
                          <button 
                            onClick={() => handleViewQuote(donation.id)}
                            style={{ 
                              color: '#02391f', 
                              background: 'transparent', 
                              border: '1px solid #02391f',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#02391f';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#02391f';
                            }}
                          >견적서 확인</button>
                        )}
                        {donation.status === 'pickup_scheduled' && (
                          <div style={{ fontSize: '13px' }}>
                            <div style={{ color: '#6C757D', marginBottom: '2px' }}>픽업 일정:</div>
                            <div style={{ color: '#212529', fontWeight: '500' }}>
                              {donation.completed_at ? new Date(donation.completed_at).toLocaleDateString('ko-KR') : '2025.08.12'}
                            </div>
                          </div>
                        )}
                        {!['quote_sent', 'pickup_scheduled'].includes(donation.status) && (
                          <span style={{ color: '#6C757D', fontSize: '13px' }}>-</span>
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
      
      {/* Quote Detail Modal */}
      <QuoteDetailModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false)
          setSelectedQuote(null)
          setSelectedDonation(null)
        }}
        quote={selectedQuote as any}
        donationInfo={selectedDonation ? {
          description: selectedDonation.description,
          quantity: selectedDonation.quantity,
          unit: (selectedDonation as any).unit || 'kg',
          pickup_location: selectedDonation.pickup_location,
          pickup_deadline: selectedDonation.pickup_deadline,
          created_at: selectedDonation.created_at
        } : null}
        onAccept={handleAcceptQuote as any}
        onReject={handleRejectQuote as any}
      />
      
    </div>
  )
}