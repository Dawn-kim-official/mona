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
  'pickup_coordinating': { text: '픽업 일정 조율', color: '#6F42C1' },
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
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

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

    if (filterStatus) {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching proposals:', error)
      setProposals([])
    } else {
      console.log('Fetched proposals:', data)
      
      // quotes 정보를 별도로 가져오기
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
        setProposals(proposalsWithQuotes)
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
    { id: 'rejected', label: '거절' },
    { id: 'received', label: '수령 완료' }
  ]

  async function handleReceiptUpload(proposal: Proposal) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setGeneratingPdf(proposal.id);
      
      try {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${proposal.id}_${Date.now()}.${fileExt}`;
        
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('donation-receipts')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('donation-receipts')
          .getPublicUrl(fileName);
        
        
        // Update database
        await supabase
          .from('donation_matches')
          .update({ 
            receipt_issued: true,
            receipt_issued_at: new Date().toISOString(),
            receipt_file_url: publicUrl,
            status: 'received',
            received_at: new Date().toISOString()
          })
          .eq('id', proposal.id);
        
        // 기부 상태도 완료로 변경
        await supabase
          .from('donations')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', proposal.donations.id);
        
        alert('기부영수증이 업로드되었습니다. 기부 기업에서 다운로드 가능합니다.');
        fetchProposals();
      } catch (error) {
        alert('영수증 업로드 중 오류가 발생했습니다.');
      } finally {
        setGeneratingPdf(null);
      }
    };
    
    fileInput.click();
  }

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
                  if (proposal.status === 'quote_sent') {
                    if (proposal.donations?.status === 'pickup_coordinating') {
                      statusKey = 'pickup_coordinating';
                    } else if (proposal.donations?.status === 'pickup_scheduled') {
                      statusKey = 'pickup_scheduled';
                    }
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
                        {proposal.status === 'received' && !proposal.receipt_issued ? (
                          <button
                            onClick={() => handleReceiptUpload(proposal)}
                            disabled={generatingPdf === proposal.id}
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: generatingPdf === proposal.id ? '#6C757D' : '#02391f',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: generatingPdf === proposal.id ? 'not-allowed' : 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            {generatingPdf === proposal.id ? '업로드 중...' : '영수증 업로드'}
                          </button>
                        ) : proposal.receipt_issued ? (
                          <span style={{ fontSize: '12px', color: '#6C757D', marginRight: '8px' }}>
                            발급 완료
                          </span>
                        ) : null}
                        <button
                          onClick={() => router.push(`/beneficiary/proposal/${proposal.id}`)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#007BFF',
                            backgroundColor: 'transparent',
                            border: '1px solid #007BFF',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
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