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
}

const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
  'pending_review': { text: '승인 대기', color: '#FF8C00', bgColor: '#FFF3CD' },
  'rejected': { text: '승인 거절', color: '#DC3545', bgColor: '#F8D7DA' },
  'matched': { text: '수혜기관 선정', color: '#17A2B8', bgColor: '#D1ECF1' },
  'quote_sent': { text: '견적 대기', color: '#FF8C00', bgColor: '#FFF3CD' },
  'quote_accepted': { text: '견적 수락', color: '#007BFF', bgColor: '#CCE5FF' },
  'pickup_scheduled': { text: '픽업 완료', color: '#007BFF', bgColor: '#CCE5FF' },
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
      const filtered = allDonations.filter(donation => donation.status === activeTab)
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
      // Error fetching donations
    } else {
      setAllDonations(data || [])
      // 상태 변경 후에도 필터링 유지
      if (activeTab) {
        setFilteredDonations(data?.filter(donation => donation.status === activeTab) || [])
      } else {
        setFilteredDonations(data || [])
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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const navItems = [
    { id: null, label: '전체' },
    { id: 'pending_review', label: '승인 대기' },
    { id: 'rejected', label: '승인 거절' },
    { id: 'matched', label: '수혜기관 선정' },
    { id: 'quote_sent', label: '견적 발송' },
    { id: 'quote_accepted', label: '견적 수락' },
    { id: 'pickup_scheduled', label: '픽업 완료' },
    { id: 'completed', label: '기부 완료' }
  ]

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
                  textDecoration: 'none'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          기부 관리
        </h1>

        {/* 기부 목록 테이블 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                const status = statusMap[donation.status] || { text: donation.status, color: '#666' }
                return (
                  <tr key={donation.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
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
                            <Link href={`/admin/donation/${donation.id}/propose`}>
                              <button style={{
                                padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#007BFF',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}>
                              수혜기관 선택
                            </button>
                          </Link>
                          </>
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
                            <Link href={`/admin/donation/${donation.id}/quote`}>
                              <button style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#212529',
                            backgroundColor: '#ffd020',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            견적서 발송
                          </button>
                        </Link>
                        </>
                      )}
                      {donation.status === 'pickup_scheduled' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link href={`/admin/donation/${donation.id}/propose`}>
                            <button style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#28A745',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}>
                              수혜자 제안
                            </button>
                          </Link>
                          <Link href={`/admin/donation/${donation.id}/quote`}>
                            <button style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#212529',
                              backgroundColor: '#ffd020',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}>
                              견적서 업로드
                            </button>
                          </Link>
                        </div>
                      )}
                      {donation.status === 'quote_sent' && (
                        <span style={{ fontSize: '12px', color: '#666' }}>견적서 확인</span>
                      )}
                      {donation.status === 'quote_accepted' && (
                        <Link href={`/admin/donation/${donation.id}/pickup`}>
                          <button style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '400',
                            color: '#212529',
                            backgroundColor: 'transparent',
                            border: '1px solid #212529',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            픽업 일정 설정
                          </button>
                        </Link>
                      )}
                      {donation.status === 'pickup_scheduled' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            픽업 일정: {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                          </span>
                          <button
                            onClick={() => handleComplete(donation.id)}
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
                            완료 처리
                          </button>
                        </div>
                      )}
                      {donation.status === 'completed' && (
                        <Link href={`/admin/donation/${donation.id}/detail`}>
                          <button style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#007BFF',
                            backgroundColor: 'transparent',
                            border: '1px solid #007BFF',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            상세보기
                          </button>
                        </Link>
                      )}
                      {(donation.status === 'rejected' || !['pending_review', 'matched', 'quote_sent', 'quote_accepted', 'pickup_scheduled', 'completed'].includes(donation.status)) && (
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
  )
}