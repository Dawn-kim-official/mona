'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewDonationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [taxInvoiceRequested, setTaxInvoiceRequested] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'kg', // 'kg' or '개' or 'box' etc
    customUnit: '', // for custom unit input
    expiryDate: '',
    pickupDate: '',
    pickupTime: '', // 픽업 희망 시간대
    pickupAddress: '',
    additionalInfo: '',
    photos: [] as File[],
    photoType: 'main', // 'main' or 'sub'
    // 세금계산서 정보
    taxInvoiceEmail: '',
    businessType: ''
  })

  useEffect(() => {
    fetchBusinessInfo()
  }, [])

  async function fetchBusinessInfo() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (business) {
      setBusinessInfo(business)
      // 기업 정보에서 이메일과 업종 가져오기
      setFormData(prev => ({
        ...prev,
        taxInvoiceEmail: user.email || '',
        businessType: business.business_type || ''
      }))
    }
  }

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
            // Upload error
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
        description: `${formData.name} - ${formData.category}`, // Include category in description
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit === 'custom' ? formData.customUnit : formData.unit,
        condition: 'good',
        expiration_date: formData.expiryDate || null,
        pickup_deadline: formData.pickupDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
        pickup_location: formData.pickupAddress,
        pickup_time: formData.pickupTime || null,
        additional_info: formData.additionalInfo || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending_review',
        category: formData.category,
        tax_deduction_needed: taxInvoiceRequested,
        tax_invoice_email: taxInvoiceRequested ? formData.taxInvoiceEmail : null,
        business_type: taxInvoiceRequested ? formData.businessType : null
      }
      
      // Creating donation with data
      
      const { error } = await supabase.from('donations').insert(donationData)

      if (error) {
        // Donation creation error
        throw error
      }

      alert('기부가 성공적으로 등록되었습니다!')
      router.push('/business/dashboard')
    } catch (error: any) {
      // Error creating donation
      alert(`기부 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      // 새로운 파일이 선택되면 기존 파일을 완전히 대체
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
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#F8F9FA', 
      minHeight: '100%'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
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
                    e.currentTarget.style.borderColor = '#02391f'
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
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value, customUnit: '' })}
                    style={{
                      width: formData.unit === 'custom' ? '120px' : '100px',
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
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value="kg">kg</option>
                    <option value="개">개</option>
                    <option value="box">박스</option>
                    <option value="세트">세트</option>
                    <option value="L">리터(L)</option>
                    <option value="custom">직접입력</option>
                  </select>
                  {formData.unit === 'custom' && (
                    <input
                      type="text"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      placeholder="단위 입력"
                      style={{
                        width: '100px',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '1px solid #CED4DA',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: '#212529',
                        outline: 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>
                  카테고리 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#02391f'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <option value="">카테고리를 선택하세요</option>
                  <option value="개별포장 식품">개별포장 식품</option>
                  <option value="캔류">캔류</option>
                  <option value="통조림">통조림</option>
                  <option value="라면류">라면류</option>
                  <option value="가공식품">가공식품</option>
                  <option value="냉동식품">냉동식품</option>
                  <option value="음료">음료</option>
                  <option value="과자/빵">과자/빵</option>
                  <option value="생활용품">생활용품</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  소비기한 <span style={{ color: '#DC3545' }}>*</span>
                  <span style={{ fontSize: '12px', color: '#6C757D', marginLeft: '8px' }}>(개별 포장 식품은 제조일로부터 최소 1개월 이상)</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={inputStyle}
                  min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#02391f'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                추가 정보 및 특이사항
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="예: 냉장보관 필요, 유통기한이 얼마 남지 않은 제품, 대량 기부 가능 등"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
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
                    e.currentTarget.style.borderColor = '#02391f'
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
                  픽업 희망 시간대
                </label>
                <input
                  type="text"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  style={inputStyle}
                  placeholder="예: 오전 9시-12시"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#02391f'
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
                    e.currentTarget.style.borderColor = '#02391f'
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

          {/* 세금계산서 발행 여부 섹션 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>세금계산서 발행</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={taxInvoiceRequested}
                  onChange={(e) => setTaxInvoiceRequested(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                  세금계산서 발행을 신청합니다
                </span>
              </label>
            </div>

            {/* 세금계산서 신청 정보 입력 필드 */}
            {taxInvoiceRequested && (
              <div style={{ 
                padding: '20px',
                backgroundColor: '#F8F9FA',
                borderRadius: '6px',
                border: '1px solid #DEE2E6'
              }}>
                <p style={{ fontSize: '13px', color: '#6C757D', marginBottom: '16px' }}>
                  세금계산서 발행을 위한 정보를 입력해주세요. (회원정보에서 자동으로 불러왔습니다)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>
                      수신 이메일 <span style={{ color: '#DC3545' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required={taxInvoiceRequested}
                      value={formData.taxInvoiceEmail}
                      onChange={(e) => setFormData({ ...formData, taxInvoiceEmail: e.target.value })}
                      style={inputStyle}
                      placeholder="세금계산서를 받을 이메일"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#02391f'
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
                      업종 <span style={{ color: '#DC3545' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required={taxInvoiceRequested}
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      style={inputStyle}
                      placeholder="예: 제조업, 도소매업, 서비스업 등"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#02391f'
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
            )}
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
                backgroundColor: loading ? '#FFE082' : '#ffd020',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = '1';
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