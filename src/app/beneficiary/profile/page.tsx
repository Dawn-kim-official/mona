'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BeneficiaryProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    organization_name: '',
    organization_type: '',
    representative_name: '',
    phone: '',
    address: '',
    postcode: '',
    website: '',
    sns_link: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: beneficiary } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (beneficiary) {
      setFormData({
        email: user.email || '',
        organization_name: beneficiary.organization_name || '',
        organization_type: beneficiary.organization_type || '',
        representative_name: beneficiary.representative_name || '',
        phone: beneficiary.phone || '',
        address: beneficiary.address || '',
        postcode: beneficiary.postcode || '',
        website: beneficiary.website || '',
        sns_link: beneficiary.sns_link || ''
      })
    }
    
    setLoading(false)
  }

  async function handleUpdate() {
    setUpdating(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        setUpdating(false)
        return
      }

      console.log('Updating profile for user:', user.id)
      console.log('Update data:', {
        representative_name: formData.representative_name,
        phone: formData.phone,
        address: formData.address,
        postcode: formData.postcode,
        website: formData.website,
        sns_link: formData.sns_link
      })

      const { data, error } = await supabase
        .from('beneficiaries')
        .update({
          representative_name: formData.representative_name,
          phone: formData.phone,
          address: formData.address,
          postcode: formData.postcode,
          website: formData.website,
          sns_link: formData.sns_link
        })
        .eq('user_id', user.id)
        .select()

      console.log('Update result:', { data, error })

      if (error) {
        console.error('Supabase update error:', error)
        alert(`프로필 업데이트 중 오류가 발생했습니다: ${error.message}`)
      } else {
        console.log('Profile updated successfully:', data)
        alert('프로필이 성공적으로 업데이트되었습니다.')
        // 업데이트된 데이터로 폼 상태 갱신
        if (data && data.length > 0) {
          const updatedBeneficiary = data[0]
          setFormData(prev => ({
            ...prev,
            representative_name: updatedBeneficiary.representative_name || '',
            phone: updatedBeneficiary.phone || '',
            address: updatedBeneficiary.address || '',
            postcode: updatedBeneficiary.postcode || '',
            website: updatedBeneficiary.website || '',
            sns_link: updatedBeneficiary.sns_link || ''
          }))
        }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('프로필 업데이트 중 예상치 못한 오류가 발생했습니다.')
    }
    
    setUpdating(false)
  }


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingTop: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
            수혜기관 프로필
          </h1>

          {/* 기본 정보 (수정 불가) */}
          <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #DEE2E6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#495057' }}>
              기본 정보
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#6C757D'
                }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#F8F9FA',
                    color: '#000000'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#6C757D'
                }}>
                  기관명
                </label>
                <input
                  type="text"
                  value={formData.organization_name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#F8F9FA',
                    color: '#000000'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#6C757D'
                }}>
                  기관 유형
                </label>
                <input
                  type="text"
                  value={formData.organization_type}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#F8F9FA',
                    color: '#000000'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 수정 가능한 정보 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#495057' }}>
              담당자 정보
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  담당자명
                </label>
                <input
                  type="text"
                  value={formData.representative_name}
                  onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  담당자 연락처
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({...formData, phone: value})
                  }}
                  placeholder="01000000000"
                  maxLength={11}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 기관 정보 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#495057' }}>
              기관 정보
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  우편번호
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  기관 주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  웹사이트
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  SNS 링크
                </label>
                <input
                  type="text"
                  value={formData.sns_link}
                  onChange={(e) => setFormData({...formData, sns_link: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleUpdate}
              disabled={updating}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: updating ? '#6C757D' : '#007BFF',
                border: 'none',
                borderRadius: '4px',
                cursor: updating ? 'not-allowed' : 'pointer'
              }}
            >
              {updating ? '저장 중...' : '프로필 수정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}