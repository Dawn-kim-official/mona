'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const ReceiptTemplate = dynamic(() => import('@/app/beneficiary/receipts/ReceiptTemplate'), { ssr: false })

interface Proposal {
  id: string
  donation_id: string
  beneficiary_id: string
  status: string
  proposed_at: string
  responded_at: string | null
  receipt_issued: boolean
  receipt_issued_at: string | null
  accepted_quantity?: number
  accepted_unit?: string
  donations: {
    id: string
    name: string
    description: string
    quantity: number
    unit: string
    pickup_deadline: string
    pickup_location: string
    remaining_quantity?: number
    status?: string
    businesses: {
      name: string
      address: string
      phone: string
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

const statusMap: { [key: string]: { text: string; color: string } } = {
  'proposed': { text: '응답 대기', color: '#FF8C00' },
  'accepted': { text: '수락', color: '#28A745' },
  'quote_sent': { text: '픽업 대기', color: '#17A2B8' },
  'pickup_scheduled': { text: '픽업 예정', color: '#007BFF' },
  'rejected': { text: '거절', color: '#DC3545' },
  'received': { text: '수령 완료', color: '#007BFF' }
}

export default function BeneficiaryProposalsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [beneficiary, setBeneficiary] = useState<any>(null)

  useEffect(() => {
    fetchProposals()
  }, [filterStatus])

  async function fetchProposals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get beneficiary info
    const { data: beneficiaryData } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!beneficiaryData) {
      return
    }
    setBeneficiary(beneficiaryData)

    // Fetch proposals from donation_matches
    let query = supabase
      .from('donation_matches')
      .select('*, donations(*, businesses(*))')
      .eq('beneficiary_id', beneficiaryData.id)
      .order('proposed_at', { ascending: false })

    // 특별한 필터링 로직: pickup_scheduled는 donation 상태로 필터링
    if (filterStatus === 'pickup_scheduled') {
      query = query.eq('status', 'quote_sent')
    } else if (filterStatus) {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching proposals:', error)
      setProposals([])
    } else {
      console.log('Fetched proposals:', data)
      
      // quotes 정보를 별도로 가져오고 필터링 적용
      if (data && data.length > 0) {
        const proposalsWithQuotes = await Promise.all(
          data.map(async (proposal) => {
            const { data: quotesData } = await supabase
              .from('quotes')
              .select('*')
              .eq('donation_id', proposal.donation_id)
              .order('created_at', { ascending: false })
            
            return {
              ...proposal,
              quotes: quotesData || []
            }
          })
        )
        
        // pickup_scheduled 필터링을 위한 추가 필터링
        let filteredProposals = proposalsWithQuotes
        if (filterStatus === 'pickup_scheduled') {
          filteredProposals = proposalsWithQuotes.filter(p => 
            p.status === 'quote_sent' && p.donations?.status === 'pickup_scheduled'
          )
        }
        
        setProposals(filteredProposals)
      } else {
        setProposals(data || [])
      }
    }

    setLoading(false)
  }

  const navItems = [
    { id: null, label: '전체' },
    { id: 'proposed', label: '응답 대기' },
    { id: 'accepted', label: '수락' },
    { id: 'quote_sent', label: '픽업 대기' },
    { id: 'pickup_scheduled', label: '픽업 예정' },
    { id: 'rejected', label: '거절' },
    { id: 'received', label: '수령 완료' }
  ]


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          제안받은 기부
        </h1>

        {/* Tab Navigation */}
        <div style={{ 
          backgroundColor: '#FFFFFF',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          {navItems.map(item => (
            <button
              key={item.id || 'all'}
              onClick={() => setFilterStatus(item.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: filterStatus === item.id || (!filterStatus && !item.id) ? '2px solid #02391f' : '2px solid transparent',
                padding: '16px 24px',
                fontSize: '14px',
                color: filterStatus === item.id || (!filterStatus && !item.id) ? '#02391f' : '#6C757D',
                fontWeight: filterStatus === item.id || (!filterStatus && !item.id) ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '80px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>
              {filterStatus ? '해당하는 제안이 없습니다.' : '제안받은 기부가 없습니다.'}
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기업명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업 희망일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>제안일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>상태</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => {
                  // donation_matches status가 quote_sent이고 donation status에 따라 상태 표시 변경
                  let statusKey = proposal.status;
                  
                  // 디버깅
                  console.log('Proposal ID:', proposal.id);
                  console.log('Proposal status:', proposal.status);
                  console.log('Donation:', proposal.donations);
                  console.log('Donation status:', proposal.donations?.status);
                  
                  // quote_sent, accepted, 또는 다른 상태에서도 donation status 우선 확인
                  if (proposal.donations?.status === 'pickup_scheduled' || proposal.donations?.status === 'pickup_coordinating') {
                    statusKey = 'pickup_scheduled';
                  } else if (proposal.donations?.status === 'completed') {
                    statusKey = 'received';
                  }
                  const status = statusMap[statusKey] || { text: statusKey, color: '#666' }
                  return (
                    <tr key={proposal.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                        {proposal.donations?.name || proposal.donations?.description}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                        {proposal.accepted_quantity ? 
                          `${proposal.accepted_quantity}${proposal.accepted_unit || proposal.donations?.unit || 'kg'} / ${proposal.donations?.quantity}${proposal.donations?.unit || 'kg'}` :
                          `${proposal.donations?.remaining_quantity || proposal.donations?.quantity}${proposal.donations?.unit || 'kg'}`
                        }
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                        {proposal.donations?.businesses?.name || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                        {new Date(proposal.donations?.pickup_deadline).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                        {new Date(proposal.proposed_at).toLocaleDateString('ko-KR')}
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
                        {proposal.receipt_issued ? (
                          <span style={{ fontSize: '12px', color: '#6C757D', marginRight: '8px' }}>
                            영수증 발행 완료
                          </span>
                        ) : null}
                        <button
                          onClick={() => router.push(`/beneficiary/proposal/${proposal.id}`)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#007BFF',
                            backgroundColor: 'transparent',
                            border: '1px solid #007BFF',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '90px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#007BFF';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#007BFF';
                          }}
                        >
                          상세 보기
                        </button>
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