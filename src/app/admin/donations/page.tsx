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
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const statusFilter = searchParams.get('status')

  useEffect(() => {
    fetchDonations()
  }, [statusFilter])

  async function fetchDonations() {
    let query = supabase
      .from('donations')
      .select(`
        *,
        businesses(name)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching donations:', error)
    } else {
      setDonations(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(donationId: string) {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'matched' })
      .eq('id', donationId)

    if (!error) {
      await fetchDonations()
    }
  }

  async function handleReject(donationId: string) {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'rejected' })
      .eq('id', donationId)

    if (!error) {
      await fetchDonations()
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
      await fetchDonations()
    }
  }

  async function handleDelete(donationId: string) {
    if (confirm('정말로 이 기부를 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', donationId)

      if (!error) {
        await fetchDonations()
      } else {
        console.error('Error deleting donation:', error)
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
              <Link
                key={item.id || 'all'}
                href={item.id ? `/admin/donations?status=${item.id}` : '/admin/donations'}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: statusFilter === item.id || (!statusFilter && !item.id) ? '2px solid #1B4D3E' : '2px solid transparent',
                  padding: '0 24px',
                  fontSize: '14px',
                  color: statusFilter === item.id || (!statusFilter && !item.id) ? '#1B4D3E' : '#6C757D',
                  fontWeight: statusFilter === item.id || (!statusFilter && !item.id) ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none'
                }}
              >
                {item.label}
              </Link>
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
              {donations.map((donation) => {
                const status = statusMap[donation.status] || { text: donation.status, color: '#666' }
                return (
                  <tr key={donation.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      {donation.status === 'pending_review' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                        </div>
                      )}
                      {donation.status === 'matched' && (
                        <Link href={`/admin/donation/${donation.id}/quote`}>
                          <button style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#212529',
                            backgroundColor: '#FFC107',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            견적서 발송
                          </button>
                        </Link>
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
                              backgroundColor: '#FFC107',
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
                        <span style={{ fontSize: '12px', color: '#666' }}>-</span>
                      )}
                      {(donation.status === 'rejected' || !['pending_review', 'matched', 'quote_sent', 'quote_accepted', 'pickup_scheduled', 'completed'].includes(donation.status)) && (
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}