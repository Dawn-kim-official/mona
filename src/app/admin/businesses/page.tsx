'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Business = Database['public']['Tables']['businesses']['Row']

export default function AdminBusinessesPage() {
  const supabase = createClient()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  async function fetchBusinesses() {
    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
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
      console.error('Error updating business:', error)
    } else {
      fetchBusinesses()
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          회원 승인 대기 목록
        </h1>

        {businesses.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}