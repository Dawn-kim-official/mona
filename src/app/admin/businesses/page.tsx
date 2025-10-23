'use client'

import { useEffect, useState } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase'
import { Business } from '@/types/database'

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
    let mounted = true
    
    const loadData = async () => {
      if (mounted) {
        await fetchAllData()
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, [])

  async function fetchAllData() {
    setLoading(true)
    
    // 인증 상태 확인
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.error('Auth error:', authError)
      }
      if (!session) {
        console.warn('No active session found')
      } else {
        console.log('Session exists, user:', session.user?.email)
      }
    } catch (err) {
      console.error('Error checking session:', err)
    }
    
    // API를 통해 데이터 가져오기
    await fetchAllMembers()
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  async function fetchAllMembers() {
    try {
      console.log('Fetching members via API...')
      const response = await fetch('/api/admin/members')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('Fetched members data:', data)
      setBusinesses(data.businesses || [])
      setBeneficiaries(data.beneficiaries || [])
      
    } catch (error) {
      console.error('Error fetching members:', error)
      setBusinesses([])
      setBeneficiaries([])
    }
  }

  // 기존 함수들은 업데이트용으로 유지
  async function fetchBusinesses() {
    await fetchAllMembers()
  }

  async function fetchBeneficiaries() {
    await fetchAllMembers()
  }

  async function updateBusinessStatus(businessId: string, status: 'approved' | 'rejected', reason?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 비즈니스 정보와 이메일 가져오기
      const business = businesses.find(b => b.id === businessId)
      const recipientEmail = business?.email
      const organizationName = business?.name

      console.log('Business data:', business)
      console.log('Email to send to:', recipientEmail)

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
        // 이메일 발송
        if (recipientEmail && recipientEmail !== '-') {
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: recipientEmail,
                type: status,
                organizationName: organizationName || '기업회원',
                rejectionReason: reason || ''
              })
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              console.error('Email sending failed:', errorData)
            } else {
              const successData = await response.json()
              console.log('Email sent successfully:', successData)
            }
          } catch (emailError) {
            console.error('Email error:', emailError)
          }
        }
        
        await fetchBusinesses()
        if (status === 'rejected' && reason) {
          alert(`가입이 거절되었습니다.\n거절 사유: ${reason}\n\n이메일이 발송되었습니다.`)
        } else if (status === 'approved') {
          alert('가입이 승인되었습니다.\n승인 이메일이 발송되었습니다.')
        }
      }
    } catch (error: any) {
      console.error('Update error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  async function updateBeneficiaryStatus(beneficiaryId: string, status: 'approved' | 'rejected', reason?: string) {
    try {
      // 수혜기관 정보와 이메일 가져오기
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const recipientEmail = beneficiary?.email
      const organizationName = beneficiary?.organization_name

      console.log('Beneficiary data:', beneficiary)
      console.log('Email to send to:', recipientEmail)

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
        // 이메일 발송
        if (recipientEmail && recipientEmail !== '-') {
        try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: recipientEmail,
                type: status,
                organizationName: organizationName || '수혜기관',
                rejectionReason: reason || ''
              })
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              console.error('Email sending failed:', errorData)
            } else {
              const successData = await response.json()
              console.log('Email sent successfully:', successData)
            }
          } catch (emailError) {
            console.error('Email error:', emailError)
          }
        }
        
        await fetchBeneficiaries()
        if (status === 'rejected' && reason) {
          alert(`가입이 거절되었습니다.\n거절 사유: ${reason}\n\n이메일이 발송되었습니다.`)
        } else if (status === 'approved') {
          alert('가입이 승인되었습니다.\n승인 이메일이 발송되었습니다.')
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .main-container {
            padding: 16px !important;
          }
          .tab-container {
            overflow-x: auto !important;
            scrollbar-width: thin !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-table {
            display: block !important;
          }
          .mobile-cards {
            display: none !important;
          }
        }
      `}} />
      
      <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }} className="main-container">
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#212529' }}>
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
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}>
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
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              {filter === 'all' && <span style={{ whiteSpace: 'nowrap' }}>전체</span>}
              {filter === 'pending' && <span style={{ whiteSpace: 'nowrap' }}>승인 대기</span>}
              {filter === 'approved' && <span style={{ whiteSpace: 'nowrap' }}>승인 완료</span>}
              {filter === 'rejected' && <span style={{ whiteSpace: 'nowrap' }}>거절</span>}
            </button>
          ))}
        </div>

        {/* 기업 회원 테이블 */}
        {activeTab === 'business' && (
          <>
            {filteredBusinesses.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '80px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <p style={{ color: '#6C757D', fontSize: '16px' }}>
                  해당하는 기업 회원이 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflowX: 'auto',
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch'
                }} className="desktop-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
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
                          <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.representative_name || business.manager_name || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>{business.phone || business.manager_phone || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#212529' }}>
                            {business.email || '-'}
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
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
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
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
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
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
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
                </div>
                
                {/* Mobile Card Layout */}
                <div className="mobile-cards" style={{ display: 'none' }}>
                  {filteredBusinesses.map((business) => (
                    <div key={business.id} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      border: '1px solid #E9ECEF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                          {business.name || '-'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
                          {business.representative_name || business.manager_name || '-'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            color: business.status === 'approved' ? '#28A745' : business.status === 'rejected' ? '#DC3545' : '#FF8C00',
                            fontWeight: '500',
                            fontSize: '12px',
                            backgroundColor: business.status === 'approved' ? '#28A74520' : business.status === 'rejected' ? '#DC354520' : '#FF8C0020',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {business.status === 'approved' && '승인됨'}
                            {business.status === 'rejected' && '거절됨'}
                            {business.status === 'pending' && '대기중'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>등록번호</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {business.business_registration_number || business.business_number || '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>연락처</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {business.phone || business.manager_phone || '-'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>이메일</span>
                        <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {business.email || '-'}
                        </div>
                      </div>
                      
                      {(business.postcode && business.detail_address) && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>주소</span>
                          <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                            [{business.postcode}] {business.detail_address}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>웹사이트</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {business.website ? (
                              <a href={business.website} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>SNS</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {business.sns_link ? (
                              <a href={business.sns_link} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>등록증</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {business.business_license_url ? (
                              <a href={business.business_license_url} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>가입일</span>
                        <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {business.created_at ? new Date(business.created_at).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </div>
                      
                      {business.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => updateBusinessStatus(business.id, 'approved')}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#28A745',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flex: 1
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectClick(business.id, 'business')}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#DC3545',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flex: 1
                            }}
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* 수혜기관 회원 테이블 */}
        {activeTab === 'beneficiary' && (
          <>
            {filteredBeneficiaries.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '80px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <p style={{ color: '#6C757D', fontSize: '16px' }}>
                  해당하는 수혜기관 회원이 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflowX: 'auto',
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch'
                }} className="desktop-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
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
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
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
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
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
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
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
                </div>
                
                {/* Mobile Card Layout */}
                <div className="mobile-cards" style={{ display: 'none' }}>
                  {filteredBeneficiaries.map((beneficiary) => (
                    <div key={beneficiary.id} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      border: '1px solid #E9ECEF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                          {beneficiary.organization_name || '-'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
                          {beneficiary.representative_name || beneficiary.manager_name || '-'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            color: beneficiary.status === 'approved' ? '#28A745' : beneficiary.status === 'rejected' ? '#DC3545' : '#FF8C00',
                            fontWeight: '500',
                            fontSize: '12px',
                            backgroundColor: beneficiary.status === 'approved' ? '#28A74520' : beneficiary.status === 'rejected' ? '#DC354520' : '#FF8C0020',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {beneficiary.status === 'approved' && '승인됨'}
                            {beneficiary.status === 'rejected' && '거절됨'}
                            {beneficiary.status === 'pending' && '대기중'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>등록번호</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {beneficiary.registration_number || '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>연락처</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {beneficiary.phone || beneficiary.manager_phone || '-'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>이메일</span>
                        <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {beneficiary.email || '-'}
                        </div>
                      </div>
                      
                      {((beneficiary.postcode && beneficiary.detail_address) || beneficiary.address) && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>주소</span>
                          <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                            {beneficiary.postcode && beneficiary.detail_address 
                              ? `[${beneficiary.postcode}] ${beneficiary.detail_address}`
                              : beneficiary.address}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>웹사이트</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {beneficiary.website ? (
                              <a href={beneficiary.website} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>SNS</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {beneficiary.sns_link ? (
                              <a href={beneficiary.sns_link} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#6C757D', fontSize: '12px' }}>등록증</span>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {beneficiary.tax_exempt_cert_url ? (
                              <a href={beneficiary.tax_exempt_cert_url} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007BFF', textDecoration: 'none', fontSize: '12px' }}>
                                보기
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#6C757D', fontSize: '12px' }}>가입일</span>
                        <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {beneficiary.created_at ? new Date(beneficiary.created_at).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </div>
                      
                      {beneficiary.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => updateBeneficiaryStatus(beneficiary.id, 'approved')}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#28A745',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flex: 1
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectClick(beneficiary.id, 'beneficiary')}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'white',
                              backgroundColor: '#DC3545',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flex: 1
                            }}
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        </div>
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
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #CED4DA',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#DC3545',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                거절하기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}