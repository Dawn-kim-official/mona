'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Business = Database['public']['Tables']['businesses']['Row']

export default function AdminBusinessesPage() {
  const supabase = createClient()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'business' | 'beneficiary'>('business')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 페이지 로드 시 모든 데이터를 한 번에 가져오기
  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    // 두 개의 API 호출을 병렬로 실행
    await Promise.all([
      fetchBusinesses(),
      fetchBeneficiaries()
    ])
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  async function fetchBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      // Error fetching businesses
    } else {
      setBusinesses(data || [])
    }
  }

  async function fetchBeneficiaries() {
    try {
      // 먼저 테이블 존재 여부 확인
      const { data: testData, error: testError } = await supabase
        .from('beneficiaries')
        .select('id')
        .limit(1)
      
      if (testError && testError.message.includes('relation "public.beneficiaries" does not exist')) {
        // beneficiaries 테이블이 존재하지 않습니다
        setBeneficiaries([])
        return
      }

      // 실제 데이터 가져오기
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        // Error fetching beneficiaries
        setBeneficiaries([])
      } else {
        setBeneficiaries(data || [])
      }
    } catch (err) {
      // Unexpected error
      setBeneficiaries([])
    }
  }

  async function updateBusinessStatus(businessId: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('businesses')
      .update({ 
        status, 
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', businessId)

    if (error) {
      // Error updating business
    } else {
      await fetchBusinesses()
    }
  }

  async function updateBeneficiaryStatus(beneficiaryId: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('beneficiaries')
      .update({ 
        status, 
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', beneficiaryId)

    if (error) {
      // Error updating beneficiary
    } else {
      await fetchBeneficiaries()
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          회원 승인 관리
        </h1>

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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('business')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'business' ? '2px solid #1B4D3E' : '2px solid transparent',
                padding: '16px 24px',
                fontSize: '14px',
                color: activeTab === 'business' ? '#1B4D3E' : '#6C757D',
                fontWeight: activeTab === 'business' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              기부 기업
            </button>
            <button
              onClick={() => setActiveTab('beneficiary')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'beneficiary' ? '2px solid #1B4D3E' : '2px solid transparent',
                padding: '16px 24px',
                fontSize: '14px',
                color: activeTab === 'beneficiary' ? '#1B4D3E' : '#6C757D',
                fontWeight: activeTab === 'beneficiary' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              수혜 기관
            </button>
          </div>
          
          {/* 새로고침 버튼 */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'none',
              border: '1px solid #DEE2E6',
              borderRadius: '4px',
              padding: '8px 16px',
              marginRight: '16px',
              fontSize: '13px',
              color: refreshing ? '#ADB5BD' : '#495057',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = '#F8F9FA';
                e.currentTarget.style.borderColor = '#ADB5BD';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#DEE2E6';
            }}
          >
            <span 
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                transition: 'transform 0.2s',
                transform: refreshing ? 'rotate(360deg)' : 'rotate(0deg)'
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
            </span>
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
        </div>

        {activeTab === 'business' ? (
          // 기업 테이블
          businesses.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px', 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>승인 대기 중인 회원이 없습니다.</p>
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
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>가입일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>사업자명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>대표자명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>사업자등록증</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                      {new Date(business.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {business.name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {business.representative_name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                      {business.business_license_url ? (
                        <a 
                          href={business.business_license_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#007BFF', 
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#0056B3'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#007BFF'}
                        >
                          보기
                        </a>
                      ) : (
                        <span style={{ color: '#6C757D' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => updateBusinessStatus(business.id, 'rejected')}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#DC3545',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C82333'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC3545'}
                        >
                          거절
                        </button>
                        <button
                          onClick={() => updateBusinessStatus(business.id, 'approved')}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#007BFF',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056B3'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007BFF'}
                        >
                          수락
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        ) : (
          // 수혜자 테이블
          beneficiaries.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px', 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>승인 대기 중인 수혜 기관이 없습니다.</p>
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
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>가입일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기관명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>기관 유형</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>담당자명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>연락처</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                      {new Date(beneficiary.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {beneficiary.organization_name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {beneficiary.organization_type || '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {beneficiary.representative_name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                      {beneficiary.phone}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => updateBeneficiaryStatus(beneficiary.id, 'rejected')}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#DC3545',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C82333'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC3545'}
                        >
                          거절
                        </button>
                        <button
                          onClick={() => updateBeneficiaryStatus(beneficiary.id, 'approved')}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#007BFF',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056B3'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007BFF'}
                        >
                          수락
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        )}
      </div>
    </div>
  )
}