'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface DashboardStats {
  totalBusinesses: number
  pendingApprovals: number
  totalDonations: number
  completedDonations: number
}

interface RecentActivity {
  id: string
  type: 'business_registered' | 'donation_created' | 'quote_sent' | 'pickup_completed'
  description: string
  created_at: string
}

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    pendingApprovals: 0,
    totalDonations: 0,
    completedDonations: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentActivities()
  }, [])

  async function fetchStats() {
    try {
      const { count: totalBusinesses } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })

      const { count: pendingApprovals } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: totalDonations } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })

      const { count: completedDonations } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      setStats({
        totalBusinesses: totalBusinesses || 0,
        pendingApprovals: pendingApprovals || 0,
        totalDonations: totalDonations || 0,
        completedDonations: completedDonations || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecentActivities() {
    // 예시 데이터 - 실제로는 DB에서 가져옵니다
    setRecentActivities([
      { id: '1', type: 'business_registered', description: '(주)그린푸드가 새로 등록했습니다', created_at: new Date().toISOString() },
      { id: '2', type: 'donation_created', description: '새로운 기부 요청이 등록되었습니다', created_at: new Date().toISOString() },
      { id: '3', type: 'quote_sent', description: '견적서가 발송되었습니다', created_at: new Date().toISOString() },
    ])
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>통계 로딩 중...</div>
      </div>
    )
  }

  const statCards = [
    { 
      title: '전체 사업자', 
      value: stats.totalBusinesses, 
      icon: '🏢', 
      color: '#0066FF',
      bgColor: '#0066FF15'
    },
    { 
      title: '승인 대기', 
      value: stats.pendingApprovals, 
      icon: '⏳', 
      color: '#FF8C00',
      bgColor: '#FF8C0015'
    },
    { 
      title: '전체 기부', 
      value: stats.totalDonations, 
      icon: '📦', 
      color: '#1B4D3E',
      bgColor: '#1B4D3E15'
    },
    { 
      title: '완료된 기부', 
      value: stats.completedDonations, 
      icon: '✅', 
      color: '#00AA00',
      bgColor: '#00AA0015'
    },
  ]

  const quickActions = [
    { href: '/admin/businesses', label: '승인 대기 중인 사업자 확인', icon: '🔍' },
    { href: '/admin/donations', label: '새로운 기부 요청 확인', icon: '🆕' },
    { href: '/admin/quotes', label: '견적 발송 대기 건 확인', icon: '📝' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#212529', marginBottom: '8px' }}>
          관리자 대시보드
        </h1>
        <p style={{ fontSize: '16px', color: '#6c757d' }}>
          MONA 플랫폼의 전체 현황을 한눈에 확인하세요
        </p>
      </div>
      
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {statCards.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {stat.icon}
              </div>
              <span style={{ 
                fontSize: '36px', 
                fontWeight: 'bold',
                color: stat.color
              }}>
                {stat.value}
              </span>
            </div>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500',
              color: '#6c757d',
              margin: 0
            }}>
              {stat.title}
            </h3>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Activities */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#212529',
            marginBottom: '24px'
          }}>
            최근 활동
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map(activity => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: activity.type === 'business_registered' ? '#0066FF' :
                                  activity.type === 'donation_created' ? '#FF8C00' :
                                  activity.type === 'quote_sent' ? '#1B4D3E' : '#00AA00'
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#212529' }}>
                    {activity.description}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                    {new Date(activity.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#212529',
            marginBottom: '24px'
          }}>
            빠른 작업
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                backgroundColor: '#FFB80015',
                border: '1px solid #FFB80030',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#212529',
                transition: 'all 0.2s',
                fontSize: '15px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFB80025';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFB80015';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              >
                <span style={{ fontSize: '20px' }}>{action.icon}</span>
                <span>{action.label}</span>
                <span style={{ marginLeft: 'auto', color: '#FFB800' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}