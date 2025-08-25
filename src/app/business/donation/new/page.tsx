'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewDonationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'kg', // 'kg' or '개'
    expiryDate: '',
    pickupDate: '',
    pickupAddress: '',
    additionalInfo: '',
    photos: [] as File[],
    photoType: 'main' // 'main' or 'sub'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!business) throw new Error('Business not found')

      // Upload photos if any
      const photoUrls = []
      if (formData.photos.length > 0) {
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop()
          const fileName = `${business.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { data, error } = await supabase.storage
            .from('donation-photos')
            .upload(fileName, photo)
          
          if (error) {
            console.error('Upload error:', error)
            // Continue without photos rather than failing
          } else if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('donation-photos')
              .getPublicUrl(data.path)
            photoUrls.push(publicUrl)
          }
        }
      }

      // Create donation
      const donationData = {
        business_id: business.id,
        name: formData.name,
        description: formData.name, // Using name as description temporarily
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        condition: 'good',
        pickup_deadline: formData.pickupDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
        pickup_location: formData.pickupAddress,
        additional_info: formData.additionalInfo || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending_review'
      }
      
      console.log('Creating donation with data:', donationData)
      
      const { error } = await supabase.from('donations').insert(donationData)

      if (error) {
        console.error('Donation creation error:', error)
        throw error
      }

      alert('기부가 성공적으로 등록되었습니다!')
      router.push('/business/dashboard')
    } catch (error: any) {
      console.error('Error creating donation:', error)
      alert(`기부 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFormData({
        ...formData,
        photos: Array.from(e.target.files)
      })
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #CED4DA',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s',
    outline: 'none',
    color: '#212529'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#212529'
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#F8F9FA', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#212529', fontWeight: '600' }}>기부 등록</h1>
          </div>
          <button
            onClick={() => router.push('/business/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: '#6C757D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '16px' }}>←</span> 목록으로
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 기부 정보 입력 섹션 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>기부 정보 입력</h2>
            <p style={{ fontSize: '14px', color: '#6C757D', marginBottom: '24px' }}>기부할 물품의 정보를 정확하게 입력해주세요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>
                  품명 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  placeholder="품명을 입력하세요"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1B4D3E'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  수량 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="수량을 입력하세요"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1B4D3E'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{
                      width: '100px',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#212529',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1B4D3E'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value="kg">kg</option>
                    <option value="개">개</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>
                  카테고리 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                  placeholder="카테고리를 입력하세요"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1B4D3E'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  소비기한
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1B4D3E'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle}>
                  픽업 희망일 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  style={inputStyle}
                  min={new Date().toISOString().split('T')[0]}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1B4D3E'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  픽업 장소 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  style={inputStyle}
                  placeholder="픽업 장소를 입력하세요"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1B4D3E'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 기부 물품 사진 업로드 섹션 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>기부 물품 사진 (최대 3장)</h2>
            <label htmlFor="photo-upload" style={{ 
              border: '2px dashed #DEE2E6',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#F8F9FA',
              marginBottom: '24px',
              position: 'relative',
              cursor: 'pointer',
              display: 'block'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#ADB5BD" style={{ marginBottom: '16px' }}>
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <p style={{ color: '#6C757D', fontSize: '14px', marginBottom: '16px' }}>클릭하여 업로드 또는 이미지 드래그하세요.</p>
              <p style={{ color: '#ADB5BD', fontSize: '12px' }}>최대 5MB</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                id="photo-upload"
              />
            </label>
            {formData.photos.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                  선택된 파일: {formData.photos.length}개
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {formData.photos.map((photo, index) => (
                    <li key={index} style={{ fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>
                      • {photo.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/business/dashboard')}
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
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529',
                backgroundColor: loading ? '#FFE082' : '#FFC107',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFB300';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFC107';
                }
              }}
            >
              {loading ? '등록 중...' : '기부 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}