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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ show: boolean; id: string; type: 'business' | 'beneficiary' }>({ 
    show: false, 
    id: '', 
    type: 'business' 
  })
  const [rejectReason, setRejectReason] = useState('')

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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
    } else {
      setBusinesses(data || [])
    }
  }

  async function fetchBeneficiaries() {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching beneficiaries:', error)
        setBeneficiaries([])
      } else {
        setBeneficiaries(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setBeneficiaries([])
    }
  }

  async function updateBusinessStatus(businessId: string, status: 'approved' | 'rejected', reason?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status, 
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: user?.id
        })
        .eq('id', businessId)

      if (error) {
        console.error('Business update error:', error)
        alert(`상태 업데이트 중 오류가 발생했습니다: ${error.message}`)
      } else {
        await fetchBusinesses()
        if (status === 'rejected' && reason) {
          // TODO: 거절 이메일 발송 로직 추가
          // 거절 사유는 이메일로만 발송하고 DB에는 저장하지 않음
          alert(`가입이 거절되었습니다.\n거절 사유: ${reason}`)
        } else if (status === 'approved') {
          alert('가입이 승인되었습니다.')
        }
      }
    } catch (error: any) {
      console.error('Update error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  async function updateBeneficiaryStatus(beneficiaryId: string, status: 'approved' | 'rejected', reason?: string) {
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({ 
          status, 
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', beneficiaryId)

      if (error) {
        console.error('Beneficiary update error:', error)
        alert(`상태 업데이트 중 오류가 발생했습니다: ${error.message}`)
      } else {
        await fetchBeneficiaries()
        if (status === 'rejected' && reason) {
          // TODO: 거절 이메일 발송 로직 추가
          // 거절 사유는 이메일로만 발송하고 DB에는 저장하지 않음
          alert(`가입이 거절되었습니다.\n거절 사유: ${reason}`)
        } else if (status === 'approved') {
          alert('가입이 승인되었습니다.')
        }
      }
    } catch (error: any) {
      console.error('Update error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  function handleRejectClick(id: string, type: 'business' | 'beneficiary') {
    setRejectModal({ show: true, id, type })
    setRejectReason('')
  }

  async function handleRejectSubmit() {
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.')
      return
    }

    if (rejectModal.type === 'business') {
      await updateBusinessStatus(rejectModal.id, 'rejected', rejectReason)
    } else {
      await updateBeneficiaryStatus(rejectModal.id, 'rejected', rejectReason)
    }
    
    setRejectModal({ show: false, id: '', type: 'business' })
    setRejectReason('')
  }

  // 필터링된 데이터
  const filteredBusinesses = businesses.filter(b => {
    if (statusFilter === 'all') return true
    return b.status === statusFilter
  })

  const filteredBeneficiaries = beneficiaries.filter(b => {
    if (statusFilter === 'all') return true
    return b.status === statusFilter
  })

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
            회원 관리
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              color: refreshing ? '#6C757D' : '#212529',
              backgroundColor: refreshing ? '#E9ECEF' : '#ffd020',
              border: 'none',
              borderRadius: '4px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: 'white', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setActiveTab('business')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: activeTab === 'business' ? '600' : '400',
              color: activeTab === 'business' ? '#fff' : '#6C757D',
              backgroundColor: activeTab === 'business' ? '#02391f' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            기업 회원 ({filteredBusinesses.length})
          </button>
          <button
            onClick={() => setActiveTab('beneficiary')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: activeTab === 'beneficiary' ? '600' : '400',
              color: activeTab === 'beneficiary' ? '#fff' : '#6C757D',
              backgroundColor: activeTab === 'beneficiary' ? '#02391f' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            수혜기관 회원 ({filteredBeneficiaries.length})
          </button>
        </div>

        {/* 상태 필터 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'pending', 'approved', 'rejected'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter as any)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: statusFilter === filter ? '600' : '400',
                color: statusFilter === filter ? '#fff' : '#6C757D',
                backgroundColor: statusFilter === filter ? '#ffd020' : 'white',
                border: `1px solid ${statusFilter === filter ? '#ffd020' : '#CED4DA'}`,
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filter === 'all' && '전체'}
              {filter === 'pending' && '승인 대기'}
              {filter === 'approved' && '승인 완료'}
              {filter === 'rejected' && '거절'}
            </button>
          ))}
        </div>

        {/* 기업 회원 테이블 */}
        {activeTab === 'business' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {filteredBusinesses.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6C757D', fontSize: '14px' }}>
                승인 대기 중인 기업이 없습니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>기관/기업명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>등록번호</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>담당자명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>담당자 연락처</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>이메일</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>주소</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>웹사이트</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>SNS</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>등록증</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>가입일</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>상태</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((business) => (
                    <tr key={business.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.name || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.business_registration_number || business.business_number || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.manager_name || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.manager_phone || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {/* 이메일 - auth.users 테이블과 조인 필요하므로 일단 '-' */}
                        -
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {business.postcode && business.detail_address 
                          ? `[${business.postcode}] ${business.detail_address}`
                          : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {business.website ? (
                          <a href={business.website} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {business.sns_link ? (
                          <a href={business.sns_link} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {business.business_license_url ? (
                          <a href={business.business_license_url} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {business.created_at ? new Date(business.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          color: business.status === 'approved' ? '#28A745' : business.status === 'rejected' ? '#DC3545' : '#FF8C00',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: business.status === 'approved' ? '#28A74520' : business.status === 'rejected' ? '#DC354520' : '#FF8C0020',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {business.status === 'approved' && '승인됨'}
                          {business.status === 'rejected' && '거절됨'}
                          {business.status === 'pending' && '대기중'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {business.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => updateBusinessStatus(business.id, 'approved')}
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
                              승인
                            </button>
                            <button
                              onClick={() => handleRejectClick(business.id, 'business')}
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
                          </div>
                        )}
                        {business.status !== 'pending' && (
                          <span style={{ fontSize: '12px', color: '#6C757D' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 수혜기관 회원 테이블 */}
        {activeTab === 'beneficiary' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {filteredBeneficiaries.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6C757D', fontSize: '14px' }}>
                승인 대기 중인 수혜기관이 없습니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>기관/기업명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>등록번호</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>담당자명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>담당자 연락처</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>이메일</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>주소</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>웹사이트</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>SNS</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>등록증</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '12px' }}>가입일</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>상태</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '12px' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{beneficiary.organization_name || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{beneficiary.registration_number || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{beneficiary.representative_name || beneficiary.manager_name || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{beneficiary.phone || beneficiary.manager_phone || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{beneficiary.email || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {beneficiary.postcode && beneficiary.detail_address 
                          ? `[${beneficiary.postcode}] ${beneficiary.detail_address}`
                          : beneficiary.address || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {beneficiary.website ? (
                          <a href={beneficiary.website} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {beneficiary.sns_link ? (
                          <a href={beneficiary.sns_link} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {beneficiary.tax_exempt_cert_url ? (
                          <a href={beneficiary.tax_exempt_cert_url} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                            보기
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                        {beneficiary.created_at ? new Date(beneficiary.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          color: beneficiary.status === 'approved' ? '#28A745' : beneficiary.status === 'rejected' ? '#DC3545' : '#FF8C00',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: beneficiary.status === 'approved' ? '#28A74520' : beneficiary.status === 'rejected' ? '#DC354520' : '#FF8C0020',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {beneficiary.status === 'approved' && '승인됨'}
                          {beneficiary.status === 'rejected' && '거절됨'}
                          {beneficiary.status === 'pending' && '대기중'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {beneficiary.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => updateBeneficiaryStatus(beneficiary.id, 'approved')}
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
                              승인
                            </button>
                            <button
                              onClick={() => handleRejectClick(beneficiary.id, 'beneficiary')}
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
                          </div>
                        )}
                        {beneficiary.status !== 'pending' && (
                          <span style={{ fontSize: '12px', color: '#6C757D' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 거절 사유 모달 */}
      {rejectModal.show && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
            onClick={() => setRejectModal({ show: false, id: '', type: 'business' })}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            zIndex: 9999,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#212529'
            }}>
              가입 거절 사유
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력하세요..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '16px',
                color: '#000000',
                backgroundColor: '#FFFFFF'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejectModal({ show: false, id: '', type: 'business' })}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#DC3545',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                거절하기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}