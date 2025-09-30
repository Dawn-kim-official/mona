'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import MatchingNotificationModal from '@/components/MatchingNotificationModal'
import PickupReminderModal from '@/components/PickupReminderModal'
import CircularProgress from '@/components/CircularProgress'

interface DashboardStats {
  totalProposals: number
  pendingProposals: number
  totalReceived: number
  thisMonthReceived: number
}

export default function BeneficiaryDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalProposals: 0,
    pendingProposals: 0,
    totalReceived: 0,
    thisMonthReceived: 0
  })
  const [recentProposals, setRecentProposals] = useState<any[]>([])
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [notificationConfirmed, setNotificationConfirmed] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setUserId(user.id)

    // Get beneficiary info
    const { data: beneficiary } = await supabase
      .from('beneficiaries')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!beneficiary) return

    setBeneficiaryId(beneficiary.id)

    // Fetch statistics
    const { data: matches } = await supabase
      .from('donation_matches')
      .select('*, donations(*)')
      .eq('beneficiary_id', beneficiary.id)

    if (matches) {
      const totalProposals = matches.length
      const pendingProposals = matches.filter(m => m.status === 'proposed').length
      const totalReceived = matches.filter(m => m.status === 'received').length
      
      // This month received
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const thisMonthReceived = matches.filter(m => 
        m.status === 'received' && 
        new Date(m.received_at) >= thisMonth
      ).length

      setStats({
        totalProposals,
        pendingProposals,
        totalReceived,
        thisMonthReceived
      })

      // Recent proposals
      const recent = matches
        .filter(m => m.status === 'proposed')
        .sort((a, b) => new Date(b.proposed_at).getTime() - new Date(a.proposed_at).getTime())
        .slice(0, 5)
      
      setRecentProposals(recent)
    }

    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
        대시보드
      </h1>

      {/* Statistics Cards with Circular Progress */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* 전체 제안 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <CircularProgress
            value={stats.totalProposals}
            maxValue={stats.totalProposals || 1}
            size={120}
            strokeWidth={8}
            primaryColor="#02391f"
            secondaryColor="#E9ECEF"
            centerText={false}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
              전체 제안
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', lineHeight: 1 }}>
              {stats.totalProposals}
            </div>
            <div style={{ fontSize: '12px', color: '#ADB5BD', marginTop: '4px' }}>
              총 제안받은 기부
            </div>
          </div>
        </div>

        {/* 대기 중 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <CircularProgress
            value={stats.pendingProposals}
            maxValue={stats.totalProposals || 1}
            size={120}
            strokeWidth={8}
            primaryColor="#FF8C00"
            secondaryColor="#E9ECEF"
            label={`${stats.totalProposals > 0 ? Math.round((stats.pendingProposals / stats.totalProposals) * 100) : 0}%`}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
              대기 중
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', lineHeight: 1 }}>
              {stats.pendingProposals}
            </div>
            <div style={{ fontSize: '12px', color: '#ADB5BD', marginTop: '4px' }}>
              응답 대기 중인 제안
            </div>
          </div>
        </div>

        {/* 수령 완료 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <CircularProgress
            value={stats.totalReceived}
            maxValue={stats.totalProposals || 1}
            size={120}
            strokeWidth={8}
            primaryColor="#28A745"
            secondaryColor="#E9ECEF"
            label={`${stats.totalProposals > 0 ? Math.round((stats.totalReceived / stats.totalProposals) * 100) : 0}%`}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
              수령 완료
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', lineHeight: 1 }}>
              {stats.totalReceived}
            </div>
            <div style={{ fontSize: '12px', color: '#ADB5BD', marginTop: '4px' }}>
              총 수령한 기부
            </div>
          </div>
        </div>

        {/* 이번 달 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <CircularProgress
            value={stats.thisMonthReceived}
            maxValue={stats.thisMonthReceived || 1}
            size={120}
            strokeWidth={8}
            primaryColor="#ffd020"
            secondaryColor="#E9ECEF"
            centerText={false}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
              이번 달
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', lineHeight: 1 }}>
              {stats.thisMonthReceived}
            </div>
            <div style={{ fontSize: '12px', color: '#ADB5BD', marginTop: '4px' }}>
              이번 달 수령
            </div>
          </div>
        </div>
      </div>

      {/* Recent Proposals */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#212529' }}>
            최근 제안받은 기부
          </h2>
          <button
            onClick={() => router.push('/beneficiary/proposals')}
            style={{
              fontSize: '14px',
              color: '#007BFF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            전체 보기
          </button>
        </div>

        {recentProposals.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6C757D'
          }}>
            제안받은 기부가 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #DEE2E6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업 희망일</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>제안일</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {recentProposals.map((proposal) => (
                <tr key={proposal.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                    {proposal.donations?.name || proposal.donations?.description}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                    {proposal.donations?.quantity}{proposal.donations?.unit || 'kg'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                    {new Date(proposal.donations?.pickup_deadline).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                    {new Date(proposal.proposed_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Matching Notification Modal */}
      {userId && (
        <MatchingNotificationModal
          userType="beneficiary"
          userId={userId}
          onConfirm={() => setNotificationConfirmed(true)}
        />
      )}
      
      {/* Pickup Reminder Modal */}
      {userId && (
        <PickupReminderModal
          userType="beneficiary"
          userId={userId}
        />
      )}
    </div>
  )
}