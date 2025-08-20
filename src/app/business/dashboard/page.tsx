'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'
import Link from 'next/link'

type Donation = Database['public']['Tables']['donations']['Row']

const statusMap: { [key: string]: { text: string; color: string } } = {
  'pending_review': { text: '승인 대기', color: '#FF8C00' },
  'quote_sent': { text: '승인 거절', color: '#FF0000' },
  'quote_accepted': { text: '견적 대기', color: '#FF8C00' },
  'matched': { text: '견적 대기', color: '#FF8C00' },
  'pickup_scheduled': { text: '견적 수락', color: '#0066FF' },
  'completed': { text: '픽업 완료', color: '#00AA00' }
}

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'pending_review', label: '승인 대기' },
  { id: 'rejected', label: '승인 거절' },
  { id: 'quote_pending', label: '견적 대기' },
  { id: 'quote_accepted', label: '견적 수락' },
  { id: 'quote_rejected', label: '견적 거절' },
  { id: 'pickup_completed', label: '픽업 완료' },
  { id: 'donation_completed', label: '기부 완료' }
]

export default function BusinessDashboardPage() {
  const supabase = createClient()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

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
      console.error('Error fetching donations:', error)
    } else {
      setDonations(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const filteredDonations = activeTab === 'all' 
    ? donations 
    : donations.filter(donation => {
        switch(activeTab) {
          case 'pending_review': return donation.status === 'pending_review';
          case 'rejected': return donation.status === 'quote_sent';
          case 'quote_pending': return donation.status === 'matched' || donation.status === 'quote_accepted';
          case 'quote_accepted': return donation.status === 'pickup_scheduled';
          case 'quote_rejected': return false;
          case 'pickup_completed': return donation.status === 'completed';
          case 'donation_completed': return donation.status === 'completed';
          default: return true;
        }
      });

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Main Content Container */}
      <div style={{ padding: '40px' }}>
        {/* Tab Navigation */}
        <div style={{ 
          backgroundColor: '#F5F5F5',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 0',
                  fontSize: '15px',
                  color: activeTab === tab.id ? '#333333' : '#888888',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#555555';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#888888';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link href="/business/donation/new">
            <button style={{ 
              backgroundColor: '#FFC107', 
              color: '#333333', 
              padding: '10px 24px', 
              border: 'none', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFB300';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFC107';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              <span style={{ fontSize: '16px', lineHeight: '1' }}>+</span>
              새 기부 등록
            </button>
          </Link>
        </div>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1B4D3E' }}>내 기부 목록</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>등록하신 기부 내역을 확인하고 관리할 수 있습니다.</p>
        </div>

        {filteredDonations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px', 
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ color: '#999', fontSize: '16px', marginBottom: '20px' }}>등록된 기부가 없습니다.</p>
            <Link href="/business/donation/new">
              <button style={{ 
                backgroundColor: '#FFB800', 
                color: 'white', 
                padding: '12px 32px', 
                border: 'none', 
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                첫 기부 등록하기
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '80px' }}>이미지</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '100px' }}>등록일</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '80px' }}>수량</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '120px' }}>픽업희망일</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '120px' }}>상태</th>
                  <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '150px' }}>작업</th>
                </tr>
              </thead>
            <tbody>
              {filteredDonations.map((donation) => {
                const status = statusMap[donation.status] || { text: donation.status, color: '#666' }
                return (
                    <tr key={donation.id} style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e9ecef'
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
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>{donation.description}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6c757d' }}>{new Date(donation.created_at).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{donation.quantity}kg</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6c757d' }}>{new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          color: status.color,
                          fontWeight: '600',
                          fontSize: '13px',
                          backgroundColor: status.color + '15',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          border: `1px solid ${status.color}30`
                        }}>
                          {status.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {donation.status === 'quote_sent' && (
                          <button style={{ 
                            color: '#0066FF', 
                            background: 'none', 
                            border: '1px solid #0066FF',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0066FF';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#0066FF';
                          }}
                          >견적서 확인</button>
                        )}
                        {donation.status === 'pickup_scheduled' && (
                          <div style={{ fontSize: '13px' }}>
                            <div style={{ color: '#6c757d', marginBottom: '4px' }}>픽업 예정일</div>
                            <div style={{ color: '#212529', fontWeight: '500' }}>
                              {donation.completed_at ? new Date(donation.completed_at).toLocaleDateString('ko-KR') : '-'}
                            </div>
                          </div>
                        )}
                        {donation.status === 'completed' && (
                          <button style={{ 
                            color: '#00AA00', 
                            background: 'none', 
                            border: '1px solid #00AA00',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>ESG 리포트</button>
                        )}
                        {!['quote_sent', 'pickup_scheduled', 'completed'].includes(donation.status) && (
                          <span style={{ color: '#adb5bd', fontSize: '13px' }}>-</span>
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