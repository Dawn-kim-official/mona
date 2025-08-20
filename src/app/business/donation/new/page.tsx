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
    description: '',
    quantity: '',
    unit: 'kg',
    condition: 'good',
    pickupAddress: '',
    pickupDeadline: '',
    additionalInfo: '',
    photos: [] as File[]
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

      // Upload photos
      const photoUrls = []
      for (const photo of formData.photos) {
        const { data, error } = await supabase.storage
          .from('donation_photos')
          .upload(`${business.id}/${Date.now()}-${photo.name}`, photo)
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('donation_photos')
            .getPublicUrl(data.path)
          photoUrls.push(publicUrl)
        }
      }

      // Create donation
      const { error } = await supabase.from('donations').insert({
        business_id: business.id,
        name: formData.name,
        description: formData.description,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        condition: formData.condition as any,
        pickup_deadline: formData.pickupDeadline,
        pickup_location: formData.pickupAddress,
        additional_info: formData.additionalInfo,
        photos: photoUrls
      })

      if (error) throw error

      router.push('/business/dashboard')
    } catch (error) {
      console.error('Error creating donation:', error)
      alert('기부 등록 중 오류가 발생했습니다.')
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
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
    outline: 'none'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#212529'
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#fafafa', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1B4D3E' }}>새 기부 등록</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>기부하실 물품의 정보를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: 'white', 
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              물품명 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="예: 의류, 전자제품, 가구 등"
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              상세 설명 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              placeholder="물품의 상태, 특징 등을 자세히 설명해주세요"
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={labelStyle}>
                수량 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                />
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{ ...inputStyle, width: '100px' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                >
                  <option value="kg">kg</option>
                  <option value="개">개</option>
                  <option value="박스">박스</option>
                  <option value="세트">세트</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                물품 상태 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
              >
                <option value="new">새상품</option>
                <option value="good">좋음</option>
                <option value="fair">보통</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              픽업 주소 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              style={inputStyle}
              placeholder="픽업 가능한 주소를 입력해주세요"
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              픽업 희망일 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="date"
              required
              value={formData.pickupDeadline}
              onChange={(e) => setFormData({ ...formData, pickupDeadline: e.target.value })}
              style={inputStyle}
              min={new Date().toISOString().split('T')[0]}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>
              사진 업로드
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              style={inputStyle}
            />
            <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px' }}>
              최대 5장까지 업로드 가능합니다
            </p>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={labelStyle}>
              추가 정보
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="기타 참고사항이 있으면 입력해주세요"
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFB800'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/business/dashboard')}
              style={{
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: '500',
                color: '#666',
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: loading ? '#FDD676' : '#FFB800',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#F0A800';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 184, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFB800';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
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