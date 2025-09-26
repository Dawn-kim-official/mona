'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    daum: any
  }
}

export default function NewDonationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [taxInvoiceRequested, setTaxInvoiceRequested] = useState(false)
  const [useBusinessAddress, setUseBusinessAddress] = useState(false)
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
    pickupPostcode: '',
    pickupDetailAddress: '',
    additionalInfo: '',
    photos: [] as File[],
    photoType: 'main', // 'main' or 'sub'
    directDelivery: false, // 직접 배달 가능 여부
    productDetailUrl: '', // 제품 상세정보 링크
    // 세금계산서 정보
    taxInvoiceEmail: '',
    businessType: ''
  })

  useEffect(() => {
    fetchBusinessInfo()
    
    // Load Daum postcode script
    if (typeof window !== 'undefined' && !window.daum) {
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      document.body.appendChild(script)
    }
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
      const fullPickupAddress = formData.pickupDetailAddress 
        ? `${formData.pickupAddress} ${formData.pickupDetailAddress}`
        : formData.pickupAddress
      
      const donationData = {
        business_id: business.id,
        name: formData.name,
        description: `${formData.name} - ${formData.category}`, // Include category in description
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit === 'custom' ? formData.customUnit : formData.unit,
        condition: 'good',
        expiration_date: formData.expiryDate || '',
        pickup_deadline: formData.pickupDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
        pickup_location: fullPickupAddress,
        pickup_time: formData.pickupTime || null,
        additional_info: formData.additionalInfo || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending_review',
        category: formData.category,
        direct_delivery_available: formData.directDelivery, // 직접 배달 가능 여부
        product_detail_url: formData.productDetailUrl || null, // 제품 상세정보 링크
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
      const newFiles = Array.from(e.target.files)
      const currentCount = formData.photos.length
      const newCount = newFiles.length
      
      // 현재 사진이 3장 이상이면 추가 불가
      if (currentCount >= 3) {
        alert('사진은 최대 3장까지만 등록할 수 있습니다.')
        e.target.value = '' // input 초기화
        return
      }
      
      // 추가하려는 사진을 포함해서 3장을 초과하는 경우
      if (currentCount + newCount > 3) {
        const allowedCount = 3 - currentCount
        alert(`현재 ${currentCount}장이 등록되어 있습니다. ${allowedCount}장만 더 추가할 수 있습니다.`)
        
        // 3장 제한에 맞춰서만 추가
        setFormData({
          ...formData,
          photos: [...formData.photos, ...newFiles.slice(0, allowedCount)]
        })
      } else {
        // 3장 이하인 경우 정상 추가
        setFormData({
          ...formData,
          photos: [...formData.photos, ...newFiles]
        })
      }
      
      e.target.value = '' // input 초기화
    }
  }

  function removePhoto(index: number) {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  // 주소 검색 함수
  const handleAddressSearch = () => {
    if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          setFormData({
            ...formData,
            pickupPostcode: data.zonecode,
            pickupAddress: data.roadAddress || data.jibunAddress
          })
        }
      }).open()
    }
  }

  // 사업지 주소 자동입력 토글
  const toggleBusinessAddress = () => {
    const newUseBusinessAddress = !useBusinessAddress
    setUseBusinessAddress(newUseBusinessAddress)
    
    if (newUseBusinessAddress && businessInfo) {
      // address 필드가 없으면 경고 메시지
      if (!businessInfo.address && !businessInfo.postcode) {
        alert('등록된 사업지 주소가 없습니다. 회원정보에서 주소를 등록해주세요.')
        setUseBusinessAddress(false)
        return
      }
      
      // 사업지 주소로 자동 입력
      setFormData({
        ...formData,
        pickupPostcode: businessInfo.postcode || '',
        pickupAddress: businessInfo.address || '',
        pickupDetailAddress: businessInfo.detail_address || ''
      })
    } else if (!newUseBusinessAddress) {
      // 주소 초기화
      setFormData({
        ...formData,
        pickupPostcode: '',
        pickupAddress: '',
        pickupDetailAddress: ''
      })
    }
  }

  // 식품 카테고리 체크 함수
  function isFoodCategory() {
    const foodCategories = ['식품']
    return foodCategories.includes(formData.category)
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
                  onChange={(e) => {
                    const newCategory = e.target.value
                    const foodCategories = ['식품', '생필품', '가구', '가전제품', '의류', '기타']
                    // 비식품 카테고리로 변경 시 소비기한 초기화
                    if (!foodCategories.includes(newCategory)) {
                      setFormData({ ...formData, category: newCategory, expiryDate: '' })
                    } else {
                      setFormData({ ...formData, category: newCategory })
                    }
                  }}
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
                  <option value="식품">식품 (과잉재고, 유통기한 임박 식품 등)</option>
                  <option value="생필품">생필품 (세면도구, 생활용품 등)</option>
                  <option value="가구">가구</option>
                  <option value="가전제품">가전제품</option>
                  <option value="의류">의류</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  소비기한 {isFoodCategory() && <span style={{ color: '#DC3545' }}>*</span>}
                  {isFoodCategory() && <span style={{ fontSize: '12px', color: '#6C757D', marginLeft: '8px' }}>(개별 포장 식품은 제조일로부터 최소 1개월 이상)</span>}
                </label>
                <input
                  type="date"
                  required={isFoodCategory()}
                  disabled={!isFoodCategory()}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{
                    ...inputStyle,
                    backgroundColor: !isFoodCategory() ? '#F8F9FA' : '#FFFFFF',
                    cursor: !isFoodCategory() ? 'not-allowed' : 'text'
                  }}
                  min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onFocus={(e) => {
                    if (isFoodCategory()) {
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isFoodCategory()) {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                />
                {!isFoodCategory() && formData.category && (
                  <small style={{ fontSize: '12px', color: '#6C757D', marginTop: '4px', display: 'block' }}>
                    식품 카테고리만 소비기한 입력이 필요합니다.
                  </small>
                )}
              </div>
            </div>

            <div>
                <label style={labelStyle}>
                  제품 상세정보 링크
                </label>
                <input
                  type="url"
                  value={formData.productDetailUrl}
                  onChange={(e) => setFormData({ ...formData, productDetailUrl: e.target.value })}
                  style={{...inputStyle, marginBottom: '24px'}}
                  placeholder="예: https://www.example.com/product-detail"
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
                placeholder="예: 냉장보관 필요, 유통기한 임박, 매달 반복적으로 발생 등"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
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
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={labelStyle}>
                  픽업 장소 <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleBusinessAddress}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: useBusinessAddress ? '#FFFFFF' : '#02391f',
                    backgroundColor: useBusinessAddress ? '#02391f' : '#FFFFFF',
                    border: `1px solid ${useBusinessAddress ? '#02391f' : '#CED4DA'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (useBusinessAddress) {
                      e.currentTarget.style.backgroundColor = '#024d29'
                    } else {
                      e.currentTarget.style.backgroundColor = '#F8F9FA'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (useBusinessAddress) {
                      e.currentTarget.style.backgroundColor = '#02391f'
                    } else {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                    }
                  }}
                >
                  {useBusinessAddress ? '✓ 사업지 주소 사용중' : '사업지 주소로 자동입력'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  required
                  value={formData.pickupAddress}
                  onChange={(e) => !useBusinessAddress && setFormData({ ...formData, pickupAddress: e.target.value })}
                  style={{ 
                    ...inputStyle, 
                    flex: 1,
                    backgroundColor: useBusinessAddress ? '#F8F9FA' : '#FFFFFF',
                    cursor: useBusinessAddress ? 'not-allowed' : 'text'
                  }}
                  placeholder="주소를 검색하세요"
                  readOnly
                  onFocus={(e) => {
                    if (!useBusinessAddress) {
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CED4DA'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={useBusinessAddress}
                  style={{
                    padding: '14px 20px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: useBusinessAddress ? '#ADB5BD' : '#FFFFFF',
                    backgroundColor: useBusinessAddress ? '#E9ECEF' : '#02391f',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: useBusinessAddress ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!useBusinessAddress) {
                      e.currentTarget.style.backgroundColor = '#024d29'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!useBusinessAddress) {
                      e.currentTarget.style.backgroundColor = '#02391f'
                    }
                  }}
                >
                  주소 검색
                </button>
              </div>
              <input
                type="text"
                value={formData.pickupDetailAddress}
                onChange={(e) => !useBusinessAddress && setFormData({ ...formData, pickupDetailAddress: e.target.value })}
                style={{ 
                  ...inputStyle,
                  backgroundColor: useBusinessAddress ? '#F8F9FA' : '#FFFFFF',
                  cursor: useBusinessAddress ? 'not-allowed' : 'text'
                }}
                placeholder="상세주소"
                readOnly={useBusinessAddress}
                onFocus={(e) => {
                  if (!useBusinessAddress) {
                    e.currentTarget.style.borderColor = '#02391f'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27, 77, 62, 0.1)'
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
            
            {/* 직접 배달 가능 여부 및 제품 상세정보 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={formData.directDelivery}
                  onChange={(e) => setFormData({ ...formData, directDelivery: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#212529', fontWeight: '500' }}>
                  직접 배달 가능
                </span>
                <span style={{ fontSize: '12px', color: '#6C757D', marginLeft: '8px' }}>
                  (체크 시 직접 배달이 가능함을 표시합니다)
                </span>
              </label>
            
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
              border: formData.photos.length >= 3 ? '2px dashed #CED4DA' : '2px dashed #DEE2E6',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: formData.photos.length >= 3 ? '#E9ECEF' : '#F8F9FA',
              marginBottom: '24px',
              position: 'relative',
              cursor: formData.photos.length >= 3 ? 'not-allowed' : 'pointer',
              opacity: formData.photos.length >= 3 ? 0.6 : 1,
              display: 'block'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#ADB5BD" style={{ marginBottom: '16px' }}>
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <p style={{ color: '#6C757D', fontSize: '14px', marginBottom: '8px' }}>클릭하여 업로드 또는 이미지 드래그하세요.</p>
              <p style={{ color: '#ADB5BD', fontSize: '12px', marginBottom: '4px' }}>최대 3장까지 업로드 가능</p>
              <p style={{ color: '#ADB5BD', fontSize: '12px' }}>파일당 최대 5MB</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={formData.photos.length >= 3}
                style={{ display: 'none' }}
                id="photo-upload"
              />
            </label>
            {formData.photos.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', color: '#495057', marginBottom: '12px' }}>
                  선택된 파일: {formData.photos.length}/3
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                  gap: '12px' 
                }}>
                  {formData.photos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <div style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #DEE2E6',
                        position: 'relative',
                        backgroundColor: '#F8F9FA'
                      }}>
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={photo.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(220, 53, 69, 0.9)',
                          border: 'none',
                          color: 'white',
                          fontSize: '16px',
                          lineHeight: '1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#DC3545'
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        ×
                      </button>
                      <p style={{ 
                        fontSize: '11px', 
                        color: '#6C757D', 
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {photo.name}
                      </p>
                    </div>
                  ))}
                </div>
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