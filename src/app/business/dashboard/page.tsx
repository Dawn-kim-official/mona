'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BusinessDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDonations: 0,
    completedDonations: 0,
    pendingDonations: 0
  })
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [esgReportUrl, setEsgReportUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id, esg_report_url')
      .eq('user_id', user.id)
      .single()

    if (!business) return

    // Set ESG report URL if exists
    if (business.esg_report_url) {
      setEsgReportUrl(business.esg_report_url)
    }

    // Fetch all donations for stats
    const { data: allDonations } = await supabase
      .from('donations')
      .select('status')
      .eq('business_id', business.id)

    if (allDonations) {
      const total = allDonations.length
      const completed = allDonations.filter(d => d.status === 'completed').length
      const pending = allDonations.filter(d => 
        ['pending_review', 'quote_sent', 'matched', 'quote_accepted', 'pickup_scheduled'].includes(d.status)
      ).length

      setStats({
        totalDonations: total,
        completedDonations: completed,
        pendingDonations: pending
      })
    }

    // Fetch recent donations (최근 2개)
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(2)

    setRecentDonations(donations || [])
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 기부 현황 요약 섹션 */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
            기부 현황 요약
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div style={{ 
              textAlign: 'center',
              padding: '24px',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#212529', marginBottom: '8px' }}>
                {stats.totalDonations}
              </div>
              <div style={{ fontSize: '16px', color: '#6C757D' }}>전체 기부 건수</div>
            </div>
            
            <div style={{ 
              textAlign: 'center',
              padding: '24px',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#212529', marginBottom: '8px' }}>
                {stats.completedDonations}
              </div>
              <div style={{ fontSize: '16px', color: '#6C757D' }}>완료된 기부</div>
            </div>
            
            <div style={{ 
              textAlign: 'center',
              padding: '24px',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#FFC107', marginBottom: '8px' }}>
                {stats.pendingDonations}
              </div>
              <div style={{ fontSize: '16px', color: '#6C757D' }}>진행 중인 기부</div>
            </div>
          </div>
        </div>

        {/* ESG 리포트 섹션 */}
        {esgReportUrl && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
                  ESG 리포트
                </h2>
                <p style={{ fontSize: '14px', color: '#6C757D' }}>
                  2025년 ESG 리포트가 준비되었습니다. (업데이트: 2025.07.31)
                </p>
              </div>
              <a 
                href={esgReportUrl} 
                download
                style={{ textDecoration: 'none' }}
              >
                <button style={{
                  backgroundColor: '#FFC107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
                >
                  ESG 리포트 다운로드
                </button>
              </a>
            </div>
          </div>
        )}

        {/* 최근 기부 이력 섹션 */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
            최근 기부 이력
          </h2>
          
          {recentDonations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6C757D' }}>
              <p>아직 기부 이력이 없습니다.</p>
              <Link href="/business/donation/new">
                <button style={{
                  backgroundColor: '#FFC107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '16px'
                }}>
                  첫 기부 등록하기
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>이미지</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>품명</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>등록일</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>수량</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>픽업희망일</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>상태</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((donation) => (
                    <tr key={donation.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          backgroundColor: '#F8F9FA',
                          borderRadius: '4px',
                          margin: '0 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ADB5BD'
                        }}>
                          <span style={{ fontSize: '12px' }}>이미지</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {donation.name || donation.description}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                        {new Date(donation.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {donation.quantity}kg
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                        {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          color: '#28A745',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: '#28A74520',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          기부 완료
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ color: '#6C757D', fontSize: '13px' }}>-</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}