'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Donation {
  id: string
  business_id: string
  name: string
  description: string
  quantity: number
  unit: string
  pickup_deadline: string
  pickup_location: string
  status: string
  created_at: string
  photos?: string[]
  businesses?: {
    name: string
  }
  has_accepted_match?: boolean
  has_received_match?: boolean
}

const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
  'pending_review': { text: '승인 대기', color: '#FF8C00', bgColor: '#FFF3CD' },
  'rejected': { text: '승인 거절', color: '#DC3545', bgColor: '#F8D7DA' },
  'quote_sent': { text: '견적 확인 대기', color: '#FF8C00', bgColor: '#FFF3CD' },
  'quote_accepted': { text: '수혜자 매칭 대기', color: '#FFC107', bgColor: '#FFF9E6' },
  'matched': { text: '수혜기관 확정', color: '#17A2B8', bgColor: '#D1ECF1' },
  'pickup_scheduled': { text: '픽업 예정', color: '#007BFF', bgColor: '#CCE5FF' },
  'received': { text: '수령 완료', color: '#28A745', bgColor: '#D4EDDA' },
  'completed': { text: '기부 완료', color: '#28A745', bgColor: '#D4EDDA' }
}

export default function AdminDonationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [allDonations, setAllDonations] = useState<Donation[]>([])
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>(searchParams.get('status'))
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // 초기 로드 시 전체 데이터 한 번만 가져오기
  useEffect(() => {
    fetchAllDonations()
  }, [])

  // 탭 변경 시 클라이언트 사이드 필터링
  useEffect(() => {
    if (activeTab) {
      const filtered = allDonations.filter(donation => {
        if (activeTab === 'received') {
          return donation.status === 'pickup_scheduled' && donation.has_received_match
        } else if (activeTab === 'pickup_scheduled') {
          return donation.status === 'pickup_scheduled' && !donation.has_received_match
        } else {
          return donation.status === activeTab
        }
      })
      setFilteredDonations(filtered)
    } else {
      setFilteredDonations(allDonations)
    }
  }, [activeTab, allDonations])

  async function fetchAllDonations() {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        businesses(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching donations:', error)
    } else {
      // 각 donation에 대해 accepted 상태의 match가 있는지 확인하고 남은 수량 계산
      const donationsWithMatchStatus = await Promise.all(
        (data || []).map(async (donation) => {
          // 모든 매칭 정보 가져오기
          const { data: allMatches } = await supabase
            .from('donation_matches')
            .select('status, accepted_quantity')
            .eq('donation_id', donation.id)
          
          // accepted 상태 확인
          const hasAcceptedMatch = allMatches?.some(match => match.status === 'accepted') || false
          
          // 수락된 총 수량 계산
          const totalAcceptedQuantity = allMatches
            ?.filter(match => match.status === 'accepted' || match.status === 'quote_sent')
            .reduce((sum, match) => sum + (match.accepted_quantity || 0), 0) || 0
          
          const remainingQuantity = donation.quantity - totalAcceptedQuantity
          
          // 수령 완료된 매칭이 있는지 확인
          const hasReceivedMatch = allMatches?.some(match => match.status === 'received') || false
          
          return {
            ...donation,
            has_accepted_match: hasAcceptedMatch,
            has_received_match: hasReceivedMatch,
            remaining_quantity: remainingQuantity,
            total_accepted_quantity: totalAcceptedQuantity,
            match_count: allMatches?.length || 0
          }
        })
      )
      
      setAllDonations(donationsWithMatchStatus)
      // 상태 변경 후에도 필터링 유지
      if (activeTab) {
        const filtered = donationsWithMatchStatus.filter(donation => {
          if (activeTab === 'received') {
            return donation.status === 'pickup_scheduled' && donation.has_received_match
          } else if (activeTab === 'pickup_scheduled') {
            return donation.status === 'pickup_scheduled' && !donation.has_received_match
          } else {
            return donation.status === activeTab
          }
        })
        setFilteredDonations(filtered)
      } else {
        setFilteredDonations(donationsWithMatchStatus)
      }
    }
    setLoading(false)
  }

  async function handleApprove(donationId: string) {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'matched' })
      .eq('id', donationId)

    if (!error) {
      await fetchAllDonations()
    }
  }

  async function handleReject(donationId: string) {
    setSelectedDonationId(donationId)
    setShowRejectModal(true)
  }

  async function confirmReject() {
    if (!selectedDonationId) return

    const { error } = await supabase
      .from('donations')
      .update({ status: 'rejected' })
      .eq('id', selectedDonationId)

    if (!error) {
      // 여기서 거절 사유를 이메일로 발송하는 로직을 추가할 수 있습니다
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedDonationId(null)
      await fetchAllDonations()
    }
  }

  async function handleComplete(donationId: string) {
    const { error } = await supabase
      .from('donations')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', donationId)

    if (!error) {
      await fetchAllDonations()
    }
  }

  async function handleDelete(donationId: string) {
    if (confirm('정말로 이 기부를 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', donationId)

      if (!error) {
        await fetchAllDonations()
      } else {
        // Error deleting donation
        alert('기부 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  async function handlePickupComplete(donationId: string) {
    if (!confirm('픽업이 완료되었습니까? 수령 완료 상태로 변경됩니다.')) {
      return
    }

    try {
      // donation_matches에서 pickup_scheduled 또는 accepted 상태인 것을 received로 변경
      const { data: matches } = await supabase
        .from('donation_matches')
        .select('id')
        .eq('donation_id', donationId)
        .in('status', ['pickup_scheduled', 'accepted'])

      if (matches && matches.length > 0) {
        for (const match of matches) {
          await supabase
            .from('donation_matches')
            .update({
              status: 'received',
              received_at: new Date().toISOString()
            })
            .eq('id', match.id)
        }
      }

      alert('픽업이 완료 처리되었습니다.')
      await fetchAllDonations()
    } catch (error) {
      alert('픽업 완료 처리 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const navItems = [
    { id: null, label: '전체' },
    { id: 'pending_review', label: '승인 대기' },
    { id: 'rejected', label: '승인 거절' },
    { id: 'quote_sent', label: '견적 확인 대기' },
    { id: 'quote_accepted', label: '수혜자 매칭 대기' },
    { id: 'matched', label: '수혜기관 확정' },
    { id: 'pickup_coordinating', label: '픽업 일정 조율' },
    { id: 'pickup_scheduled', label: '픽업 예정' },
    { id: 'received', label: '수령 완료' },
    { id: 'completed', label: '기부 완료' }
  ]

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
          .tab-container {
            overflow-x: auto !important;
            scrollbar-width: thin !important;
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
        {/* Main Content Container */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }} className="main-container">
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'stretch', 
            height: '48px',
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
            flex: 1
          }}>
            {navItems.map(item => (
              <button
                key={item.id || 'all'}
                onClick={() => {
                  setActiveTab(item.id)
                  // URL도 업데이트하되 페이지는 리로드하지 않음
                  const url = item.id ? `/admin/donations?status=${item.id}` : '/admin/donations'
                  window.history.pushState({}, '', url)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === item.id || (!activeTab && !item.id) ? '2px solid #02391f' : '2px solid transparent',
                  padding: '0 24px',
                  fontSize: '14px',
                  color: activeTab === item.id || (!activeTab && !item.id) ? '#02391f' : '#6C757D',
                  fontWeight: activeTab === item.id || (!activeTab && !item.id) ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529', margin: 0 }}>
            기부 관리
          </h1>
          <button
            onClick={() => {
              setLoading(true)
              fetchAllDonations()
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#02391f',
              backgroundColor: 'white',
              border: '1px solid #02391f',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#02391f'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#02391f'
            }}
          >
            🔄 새로고침
          </button>
        </div>
        
        <p style={{ fontSize: '13px', color: '#6C757D', marginBottom: '24px' }}>
          💡 항목을 클릭하면 상세 정보를 볼 수 있습니다
        </p>

        {/* 기부 목록 - 데스크톱 테이블 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }} className="desktop-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>회원사</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>등록일</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업희망일</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>상태</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => {
                // Determine the correct status to display
                let statusKey = donation.status
                if (donation.status === 'pickup_scheduled' && donation.has_received_match) {
                  statusKey = 'received'
                }
                const status = statusMap[statusKey] || { text: donation.status, color: '#666' }
                return (
                  <tr 
                    key={donation.id} 
                    style={{ 
                      borderBottom: '1px solid #DEE2E6',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8F9FA'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onClick={(e) => {
                      // 버튼 클릭이 아닌 경우에만 상세 페이지로 이동
                      const target = e.target as HTMLElement
                      if (!target.closest('button') && !target.closest('a')) {
                        router.push(`/admin/donation/${donation.id}/detail`)
                      }
                    }}
                  >
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {donation.photos && donation.photos.length > 0 ? (
                        <img 
                          src={donation.photos[0]} 
                          alt={donation.name || donation.description}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #E9ECEF'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div style="width: 50px; height: 50px; backgroundColor: #F8F9FA; borderRadius: 4px; display: flex; alignItems: center; justifyContent: center; color: #ADB5BD; fontSize: 12px">이미지</div>';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          backgroundColor: '#F8F9FA',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ADB5BD',
                          fontSize: '12px'
                        }}>
                          이미지
                        </div>
                      )}
                      <span style={{ fontSize: '14px', color: '#212529' }}>
                        {donation.name || donation.description}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {donation.businesses?.name || '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {new Date(donation.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {donation.quantity}{donation.unit || 'kg'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                    </td>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {donation.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => handleReject(donation.id)}
                              style={{
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'white',
                                backgroundColor: '#DC3545',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              거절
                            </button>
                            <Link href={`/admin/donation/${donation.id}/quote`}>
                              <button style={{
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'white',
                                backgroundColor: '#02391f',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}>
                                견적서 작성
                              </button>
                            </Link>
                          </>
                        )}
                        {donation.status === 'quote_accepted' && (
                          <Link href={`/admin/donation/${donation.id}/propose`}>
                            <button style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#17A2B8',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}>
                              수혜기관 선택
                            </button>
                          </Link>
                        )}
                        {donation.status === 'matched' && (
                          <>
                            <Link href={`/admin/donation/${donation.id}/matches`}>
                              <button style={{
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'white',
                                backgroundColor: '#17A2B8',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}>
                                매칭 현황
                              </button>
                            </Link>
                            {/* donation_matches에 accepted 상태가 있는지 확인 */}
                            {donation.has_accepted_match && (
                              <Link href={`/admin/donation/${donation.id}/pickup`}>
                                <button style={{
                                  padding: '6px 16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: 'white',
                                  backgroundColor: '#6F42C1',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}>
                                  픽업 일정 설정
                                </button>
                              </Link>
                            )}
                          </>
                        )}
                      {donation.status === 'quote_sent' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>견적서 발송 완료</span>
                          <span style={{ fontSize: '11px', color: '#999' }}>견적 수락 대기중</span>
                        </div>
                      )}
                      {donation.status === 'pickup_scheduled' && !donation.has_received_match && (
                        <button
                          onClick={() => handlePickupComplete(donation.id)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
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
                          픽업 완료 처리
                        </button>
                      )}
                      {donation.status === 'completed' && (
                        <Link href={`/admin/donation/${donation.id}/detail`}>
                          <button style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
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
                            영수증 확인
                          </button>
                        </Link>
                      )}
                      {(donation.status === 'rejected' || !['pending_review', 'matched', 'quote_sent', 'quote_accepted', 'pickup_coordinating', 'pickup_scheduled', 'completed'].includes(donation.status)) && (
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>-</span>
                      )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 기부 목록 - 모바일 카드 */}
        <div className="mobile-cards" style={{ display: 'none' }}>
          {filteredDonations.map((donation) => {
            // Determine the correct status to display
            let statusKey = donation.status
            if (donation.status === 'pickup_scheduled' && donation.has_received_match) {
              statusKey = 'received'
            }
            const status = statusMap[statusKey] || { text: donation.status, color: '#666' }
            
            return (
              <div 
                key={donation.id} 
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid #E9ECEF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  // 버튼 클릭이 아닌 경우에만 상세 페이지로 이동
                  const target = e.target as HTMLElement
                  if (!target.closest('button') && !target.closest('a')) {
                    router.push(`/admin/donation/${donation.id}/detail`)
                  }
                }}
              >
                {/* 상단: 이미지와 기본 정보 */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  {donation.photos && donation.photos.length > 0 ? (
                    <img 
                      src={donation.photos[0]} 
                      alt={donation.name || donation.description}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #E9ECEF'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      backgroundColor: '#F8F9FA',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ADB5BD',
                      fontSize: '12px'
                    }}>
                      이미지
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                      {donation.name || donation.description}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '4px' }}>
                      {donation.businesses?.name || '-'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        color: status.color,
                        fontWeight: '500',
                        fontSize: '12px',
                        backgroundColor: status.color + '20',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {status.text}
                      </span>
                    </div>
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
                    <span style={{ color: '#6C757D', fontSize: '12px' }}>등록일</span>
                    <div style={{ fontWeight: '500', color: '#212529' }}>
                      {new Date(donation.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6C757D', fontSize: '12px' }}>픽업희망일</span>
                  <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                    {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* 하단: 액션 버튼들 */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {donation.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleReject(donation.id)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: '#DC3545',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        거절
                      </button>
                      <Link href={`/admin/donation/${donation.id}/quote`} style={{ flex: 1 }}>
                        <button style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: '#02391f',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                        }}>
                          견적서 작성
                        </button>
                      </Link>
                    </>
                  )}
                  {donation.status === 'quote_accepted' && (
                    <Link href={`/admin/donation/${donation.id}/propose`} style={{ flex: 1 }}>
                      <button style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: '#17A2B8',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%'
                      }}>
                        수혜기관 선택
                      </button>
                    </Link>
                  )}
                  {donation.status === 'matched' && (
                    <>
                      <Link href={`/admin/donation/${donation.id}/matches`} style={{ flex: 1 }}>
                        <button style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: '#17A2B8',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                        }}>
                          매칭 현황
                        </button>
                      </Link>
                      {donation.has_accepted_match && (
                        <Link href={`/admin/donation/${donation.id}/pickup`} style={{ flex: 1 }}>
                          <button style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#6F42C1',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: '100%'
                          }}>
                            픽업 일정 설정
                          </button>
                        </Link>
                      )}
                    </>
                  )}
                  {donation.status === 'quote_sent' && (
                    <div style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>견적서 발송 완료</span>
                      <br />
                      <span style={{ fontSize: '11px', color: '#999' }}>견적 수락 대기중</span>
                    </div>
                  )}
                  {donation.status === 'pickup_scheduled' && !donation.has_received_match && (
                    <button
                      onClick={() => handlePickupComplete(donation.id)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: '#28A745',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      픽업 완료 처리
                    </button>
                  )}
                  {donation.status === 'completed' && (
                    <Link href={`/admin/donation/${donation.id}/detail`} style={{ width: '100%' }}>
                      <button style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: '#28A745',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%'
                      }}>
                        영수증 확인
                      </button>
                    </Link>
                  )}
                  {(donation.status === 'rejected' || !['pending_review', 'matched', 'quote_sent', 'quote_accepted', 'pickup_coordinating', 'pickup_scheduled', 'completed'].includes(donation.status)) && (
                    <div style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                      <span style={{ color: '#6C757D', fontSize: '12px' }}>-</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>

        {/* 거절 사유 모달 */}
        {showRejectModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#212529' }}>기부 승인 거절</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  거절 사유
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거절 사유를 입력해주세요"
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '8px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'none',
                    color: '#000000',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                    setSelectedDonationId(null)
                  }}
                  style={{
                    padding: '8px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6C757D',
                    backgroundColor: 'white',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={confirmReject}
                  style={{
                    padding: '8px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#DC3545',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  거절
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}