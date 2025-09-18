'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

interface DonationMatch {
  id: string
  donation_id: string
  beneficiary_id: string
  status: string
  proposed_at: string
  responded_at: string | null
  accepted_quantity: number | null
  accepted_unit: string | null
  beneficiaries: {
    id: string
    organization_name: string
    organization_type: string
    address: string
    phone: string
  }
}

interface Donation {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  remaining_quantity: number | null
}

export default function DonationMatchesPage() {
  const params = useParams()
  const donationId = params.id as string
  const router = useRouter()
  const supabase = createClient()
  
  const [donation, setDonation] = useState<Donation | null>(null)
  const [matches, setMatches] = useState<DonationMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [donationId])

  async function fetchData() {
    // Fetch donation details
    const { data: donationData } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single()

    if (donationData) {
      setDonation(donationData)
    }

    // Fetch matches with beneficiary details
    const { data: matchesData } = await supabase
      .from('donation_matches')
      .select(`
        *,
        beneficiaries (
          id,
          organization_name,
          organization_type,
          address,
          phone
        )
      `)
      .eq('donation_id', donationId)
      .order('proposed_at', { ascending: false })

    if (matchesData) {
      setMatches(matchesData)
    }

    setLoading(false)
  }

  const statusMap: { [key: string]: { text: string; color: string } } = {
    'proposed': { text: '응답 대기', color: '#FF8C00' },
    'accepted': { text: '수락', color: '#28A745' },
    'rejected': { text: '거절', color: '#DC3545' },
    'received': { text: '수령 완료', color: '#007BFF' },
    'quote_sent': { text: '픽업 대기', color: '#17A2B8' }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  const totalAccepted = matches
    .filter(m => ['accepted', 'received', 'quote_sent'].includes(m.status))
    .reduce((sum, m) => sum + (m.accepted_quantity || 0), 0)

  const remaining = (donation?.quantity || 0) - totalAccepted

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
            매칭 현황: {donation?.name || donation?.description}
          </h1>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6C757D',
              backgroundColor: 'white',
              border: '1px solid #DEE2E6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            뒤로가기
          </button>
        </div>

        {/* 수량 요약 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
            수량 분배 현황
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                전체 수량
              </label>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#212529', margin: 0 }}>
                {donation?.quantity}{donation?.unit || 'kg'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                수락된 수량
              </label>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#28A745', margin: 0 }}>
                {totalAccepted}{donation?.unit || 'kg'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                남은 수량
              </label>
              <p style={{ fontSize: '24px', fontWeight: '600', color: remaining > 0 ? '#007BFF' : '#DC3545', margin: 0 }}>
                {remaining}{donation?.unit || 'kg'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                매칭된 기관
              </label>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#212529', margin: 0 }}>
                {matches.length}개
              </p>
            </div>
          </div>
        </div>

        {/* 매칭 목록 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  수혜기관
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  유형
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  제안일
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  응답일
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  수락 수량
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const status = statusMap[match.status] || { text: match.status, color: '#666' }
                return (
                  <tr key={match.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                      {match.beneficiaries?.organization_name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                      {match.beneficiaries?.organization_type}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                      {new Date(match.proposed_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                      {match.responded_at ? new Date(match.responded_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      {match.accepted_quantity ? (
                        <span style={{ color: '#28A745' }}>
                          {match.accepted_quantity}{match.accepted_unit || donation?.unit || 'kg'}
                        </span>
                      ) : (
                        <span style={{ color: '#6C757D' }}>-</span>
                      )}
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
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {matches.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>
              매칭된 수혜기관이 없습니다.
            </div>
          )}
        </div>

        {remaining > 0 && (
          <div style={{
            backgroundColor: '#FFF3CD',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            border: '1px solid #FFC107'
          }}>
            <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
              ⚠️ 아직 {remaining}{donation?.unit || 'kg'}의 수량이 남아있습니다. 
              추가로 수혜기관을 선정하거나, 기존 수혜기관에 추가 제안을 할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}