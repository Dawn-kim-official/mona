'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MatchingNotificationModal from '@/components/MatchingNotificationModal'
import PickupReminderModal from '@/components/PickupReminderModal'
import CircularProgress from '@/components/CircularProgress'

const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
  'pending_review': { text: '승인 대기', color: '#FF8C00', bgColor: '#FF8C0020' },
  'rejected': { text: '승인 거절', color: '#DC3545', bgColor: '#DC354520' },
  'matched': { text: '수혜기관 선정', color: '#17A2B8', bgColor: '#17A2B820' },
  'quote_sent': { text: '견적서 도착', color: '#FF8C00', bgColor: '#FF8C0020' },
  'quote_accepted': { text: '견적 수락', color: '#007BFF', bgColor: '#007BFF20' },
  'pickup_coordinating': { text: '픽업 일정 조율', color: '#6F42C1', bgColor: '#6F42C120' },
  'pickup_scheduled': { text: '픽업 예정', color: '#007BFF', bgColor: '#007BFF20' },
  'completed': { text: '기부 완료', color: '#28A745', bgColor: '#28A74520' }
}

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
  const [userId, setUserId] = useState<string | null>(null)
  const [notificationConfirmed, setNotificationConfirmed] = useState(false)
  const [showEsgModal, setShowEsgModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setUserId(user.id)

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

    // 한 번의 쿼리로 모든 donations 가져오기 (중복 제거)
    const { data: allDonations } = await supabase
      .from('donations')
      .select('*')  // 전체 데이터를 한 번에 가져옴
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (allDonations) {
      // 통계 계산
      const total = allDonations.length
      const completed = allDonations.filter(d => d.status === 'completed').length
      const pending = allDonations.filter(d => 
        ['pending_review', 'quote_sent', 'matched', 'quote_accepted', 'pickup_coordinating', 'pickup_scheduled'].includes(d.status)
      ).length

      setStats({
        totalDonations: total,
        completedDonations: completed,
        pendingDonations: pending
      })

      // 한 달 이내의 기부만 필터링
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      const recentDonationsData = allDonations.filter(donation => {
        const donationDate = new Date(donation.created_at)
        return donationDate >= oneMonthAgo
      })

      setRecentDonations(recentDonationsData)
    } else {
      setRecentDonations([])
    }
    
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', opacity: notificationConfirmed ? 1 : 1 }}>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 기부 현황 요약 섹션 */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
            기부 현황 요약
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
            {/* 전체 기부 */}
            <div style={{ 
              textAlign: 'center',
              padding: '32px',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <CircularProgress
                value={stats.totalDonations}
                maxValue={stats.totalDonations || 1}
                size={160}
                strokeWidth={10}
                primaryColor="#02391f"
                secondaryColor="#E9ECEF"
                centerText={false}
              />
              <div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', marginBottom: '8px' }}>
                  {stats.totalDonations}
                </div>
                <div style={{ fontSize: '14px', color: '#6C757D' }}>전체 기부 건수</div>
              </div>
            </div>
            
            {/* 완료된 기부 */}
            <div style={{ 
              textAlign: 'center',
              padding: '32px',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <CircularProgress
                value={stats.completedDonations}
                maxValue={stats.totalDonations || 1}
                size={160}
                strokeWidth={10}
                primaryColor="#28A745"
                secondaryColor="#E9ECEF"
                label={`${stats.totalDonations > 0 ? Math.round((stats.completedDonations / stats.totalDonations) * 100) : 0}%`}
                sublabel="완료율"
              />
              <div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#212529', marginBottom: '8px' }}>
                  {stats.completedDonations}
                </div>
                <div style={{ fontSize: '14px', color: '#6C757D' }}>완료된 기부</div>
              </div>
            </div>
            
            {/* 진행 중인 기부 */}
            <div style={{ 
              textAlign: 'center',
              padding: '32px',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <CircularProgress
                value={stats.pendingDonations}
                maxValue={stats.totalDonations || 1}
                size={160}
                strokeWidth={10}
                primaryColor="#ffd020"
                secondaryColor="#E9ECEF"
                label={`${stats.totalDonations > 0 ? Math.round((stats.pendingDonations / stats.totalDonations) * 100) : 0}%`}
                sublabel="진행률"
              />
              <div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#ffd020', marginBottom: '8px' }}>
                  {stats.pendingDonations}
                </div>
                <div style={{ fontSize: '14px', color: '#6C757D' }}>진행 중인 기부</div>
              </div>
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowEsgModal(true)}
                  style={{
                    backgroundColor: 'white',
                    color: '#02391f',
                    border: '2px solid #02391f',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#02391f';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#02391f';
                  }}
                >
                  보기
                </button>
                <a 
                  href={esgReportUrl} 
                  download
                  style={{ textDecoration: 'none' }}
                >
                  <button style={{
                    backgroundColor: '#ffd020',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    ESG 리포트 다운로드
                  </button>
                </a>
              </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#212529', margin: 0 }}>
              최근 기부 이력
            </h2>
            <span style={{ fontSize: '13px', color: '#6C757D' }}>
              (최근 1개월)
            </span>
          </div>
          
          {recentDonations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6C757D' }}>
              <p>아직 기부 이력이 없습니다.</p>
              <Link href="/business/donation/new">
                <button style={{
                  backgroundColor: '#ffd020',
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
                        {donation.photos && donation.photos.length > 0 ? (
                          <img 
                            src={donation.photos[0]} 
                            alt={donation.name || donation.description}
                            style={{ 
                              width: '50px', 
                              height: '50px', 
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {donation.name || donation.description}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                        {new Date(donation.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {donation.quantity}{donation.unit || 'kg'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                        {new Date(donation.pickup_deadline).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {(() => {
                          const status = statusMap[donation.status] || { 
                            text: donation.status, 
                            color: '#666', 
                            bgColor: '#66666620' 
                          };
                          return (
                            <span style={{ 
                              color: status.color,
                              fontWeight: '500',
                              fontSize: '12px',
                              backgroundColor: status.bgColor,
                              padding: '4px 12px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              {status.text}
                            </span>
                          );
                        })()}
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
      
      {/* Matching Notification Modal */}
      {userId && (
        <MatchingNotificationModal
          userType="business"
          userId={userId}
          onConfirm={() => setNotificationConfirmed(true)}
        />
      )}
      
      {/* Pickup Reminder Modal */}
      {userId && (
        <PickupReminderModal
          userType="business"
          userId={userId}
        />
      )}
      
      {/* ESG 리포트 모달 */}
      {showEsgModal && esgReportUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '900px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#212529',
                margin: 0
              }}>
                ESG 리포트
              </h2>
              <button
                onClick={() => setShowEsgModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6C757D',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            
            {/* PDF 뷰어 */}
            <div style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative'
            }}>
              {esgReportUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={esgReportUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="ESG Report"
                />
              ) : (
                <img 
                  src={esgReportUrl}
                  alt="ESG Report"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                />
              )}
            </div>
            
            {/* 모달 푸터 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowEsgModal(false)}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #DEE2E6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#ADB5BD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#DEE2E6';
                }}
              >
                닫기
              </button>
              <a href={esgReportUrl} download style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#ffd020',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  다운로드
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}