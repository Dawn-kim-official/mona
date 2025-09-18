'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

declare global {
  interface Window {
    daum: any
  }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // 단계 관리
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<'business' | 'beneficiary' | null>(null)
  
  // Step 1: 계정 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Step 2: 기업/수혜기관 정보
  // 기업 정보
  const [businessName, setBusinessName] = useState('')
  const [representativeName, setRepresentativeName] = useState('')  // 담당자명
  const [representativePhone, setRepresentativePhone] = useState('')  // 담당자 연락처
  const [businessNumber, setBusinessNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  
  // 수혜기관 정보
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState('')
  const [organizationRepName, setOrganizationRepName] = useState('')
  const [organizationRepPhone, setOrganizationRepPhone] = useState('')
  const [organizationAddress, setOrganizationAddress] = useState('')
  const [organizationPostcode, setOrganizationPostcode] = useState('')
  const [organizationWebsite, setOrganizationWebsite] = useState('')
  const [organizationSns, setOrganizationSns] = useState('')
  const [taxExemptCert, setTaxExemptCert] = useState<File | null>(null)
  
  // 수혜기관 추가 정보
  const [desiredItems, setDesiredItems] = useState<string[]>([])
  const [beneficiaryTypes, setBeneficiaryTypes] = useState<string[]>([])
  const [otherBeneficiaryType, setOtherBeneficiaryType] = useState('')
  const [canPickup, setCanPickup] = useState<string>('')
  const [canIssueReceipt, setCanIssueReceipt] = useState<string>('')
  const [additionalRequest, setAdditionalRequest] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 우편번호 검색 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // 우편번호 검색 함수
  const handlePostcodeSearch = () => {
    if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          setOrganizationPostcode(data.zonecode)
          setOrganizationAddress(data.roadAddress || data.jibunAddress)
        }
      }).open()
    }
  }

  const handleUserTypeSelect = (type: 'business' | 'beneficiary') => {
    setUserType(type)
    setStep(2)
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    // 유저 타입 선택 단계로
    setStep(1.5)
  }

  const handlePreviousStep = () => {
    if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1.5)
    } else if (step === 1.5) {
      setStep(1)
    }
    setError(null)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (userType === 'business') {
      // 기업은 바로 회원가입 진행
      await handleSignup()
    } else {
      // 수혜기관은 step 3로 진행
      setStep(3)
    }
  }

  const handleSignup = async () => {
    setLoading(true)
    setError(null)

    // 기업 회원가입 필수 항목 검증
    if (userType === 'business') {
      if (!businessName || !representativeName || !businessLicense) {
        setError('회사명, 대표자명, 사업자등록증은 필수 항목입니다.')
        setLoading(false)
        return
      }
    }

    try {
      // 먼저 이메일 중복 체크
      // 먼저 해당 이메일로 가입된 계정의 상태 확인
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email.trim().toLowerCase())
        .single()
      
      if (existingUser) {
        // 거절된 계정인지 확인
        let isRejected = false
        
        if (existingUser.role === 'business') {
          const { data: business } = await supabase
            .from('businesses')
            .select('status')
            .eq('user_id', existingUser.id)
            .single()
          
          if (business?.status === 'rejected') {
            isRejected = true
            // 거절된 기업 데이터 삭제
            await supabase.from('businesses').delete().eq('user_id', existingUser.id)
          }
        } else if (existingUser.role === 'beneficiary') {
          const { data: beneficiary } = await supabase
            .from('beneficiaries')
            .select('status')
            .eq('user_id', existingUser.id)
            .single()
          
          if (beneficiary?.status === 'rejected') {
            isRejected = true
            // 거절된 수혜기관 데이터 삭제
            await supabase.from('beneficiaries').delete().eq('user_id', existingUser.id)
          }
        }

        if (isRejected) {
          // 거절된 계정의 프로필 삭제
          await supabase.from('profiles').delete().eq('id', existingUser.id)
          
          // Auth 사용자 삭제 시도 (관리자 권한 필요)
          try {
            await supabase.rpc('delete_user', { user_id: existingUser.id })
          } catch (e) {
            console.log('Auth user deletion failed:', e)
          }
        } else {
          // 거절되지 않은 기존 사용자
          setError('이미 등록된 이메일입니다.')
          setLoading(false)
          return
        }
      }
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirm: false
          }
        },
      })

      if (signupError) {
        if (signupError.message.includes('already registered') || 
            signupError.message.includes('User already registered')) {
          throw new Error('이미 등록된 이메일입니다.')
        }
        throw signupError
      }

      if (data.user) {
        // profiles 테이블에 사용자 정보 저장
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: userType === 'business' ? 'business' : 'beneficiary'
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // 파일 업로드 처리
        let fileUrl = null
        
        if (userType === 'business') {
          // 사업자등록증 업로드
          if (businessLicense) {
            const fileExt = businessLicense.name.split('.').pop()
            const fileName = `${data.user.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
              .from('business-licenses')
              .upload(fileName, businessLicense)
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('business-licenses')
                .getPublicUrl(fileName)
              fileUrl = publicUrl
            }
          }
          
          // businesses 테이블에 정보 저장
          const { error: businessError } = await supabase
            .from('businesses')
            .insert({
              user_id: data.user.id,
              name: businessName,
              business_number: businessNumber || '',
              manager_name: representativeName,
              manager_phone: representativePhone || '',
              business_license_url: fileUrl || '',
              website: website || '',
              status: 'pending',
              contract_signed: false,
              approved_at: null
            })
          
          if (businessError) {
            throw businessError
          }
        } else {
          // 수혜기관 - 공익법인 설립허가증 업로드
          if (taxExemptCert) {
            const fileExt = taxExemptCert.name.split('.').pop()
            const fileName = `${data.user.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
              .from('beneficiary-docs')
              .upload(fileName, taxExemptCert)
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('beneficiary-docs')
                .getPublicUrl(fileName)
              fileUrl = publicUrl
            }
          }
          
          // beneficiaries 테이블에 정보 저장
          const { error: beneficiaryError } = await supabase
            .from('beneficiaries')
            .insert({
              user_id: data.user.id,
              organization_name: organizationName,
              organization_type: organizationType || '',
              manager_name: organizationRepName,  // 담당자명
              manager_phone: organizationRepPhone || '',  // 담당자 연락처
              tax_exempt_cert_url: fileUrl || '',
              address: organizationAddress || '',
              postcode: organizationPostcode || '',
              website: organizationWebsite || '',
              sns_link: organizationSns || '',
              desired_items: desiredItems,
              beneficiary_types: beneficiaryTypes.includes('기타') 
                ? [...beneficiaryTypes.filter(t => t !== '기타'), otherBeneficiaryType]
                : beneficiaryTypes,
              can_pickup: canPickup === 'yes',
              can_issue_receipt: canIssueReceipt === 'yes',
              additional_request: additionalRequest || '',
              status: 'pending',
              contract_signed: false,
              approved_at: null
            })
          
          if (beneficiaryError) {
            throw beneficiaryError
          }
        }
        
        // 로그아웃 후 승인 대기 안내
        await supabase.auth.signOut()
        alert(`회원가입이 완료되었습니다.\n\n담당자가 ${userType === 'business' ? '사업자' : '기관'} 정보를 확인 후 승인 처리할 예정입니다.\n승인 완료 시 이메일로 안내드리겠습니다.`)
        router.push('/login')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        padding: '48px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#ffd020',
            marginBottom: '8px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            MONA
          </h1>
          <p style={{ 
            color: '#6C757D', 
            fontSize: '14px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            회원가입
          </p>
        </div>

        {/* Step 1: 계정 정보 입력 */}
        {step === 1 && (
          <form onSubmit={handleNextStep}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#212529',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              계정 정보 입력
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                기관/기업 이메일 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="이메일을 입력하세요"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                비밀번호 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="최소 6자 이상"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                비밀번호 확인 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="비밀번호를 다시 입력하세요"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div style={{ 
                color: '#DC3545', 
                fontSize: '14px', 
                marginBottom: '16px',
                textAlign: 'center',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#212529',
                backgroundColor: '#ffd020',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              다음
            </button>
          </form>
        )}

        {/* Step 1.5: 유저 타입 선택 */}
        {step === 1.5 && (
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#212529',
              textAlign: 'center',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              회원 유형 선택
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <button
                type="button"
                onClick={() => handleUserTypeSelect('business')}
                style={{
                  padding: '32px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E9ECEF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.backgroundColor = '#F8F9FA'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E9ECEF'
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#212529',
                  marginBottom: '8px',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  기부 기업
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6C757D',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  물품을 기부하는 기업
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUserTypeSelect('beneficiary')}
                style={{
                  padding: '32px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E9ECEF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.backgroundColor = '#F8F9FA'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E9ECEF'
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤝</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#212529',
                  marginBottom: '8px',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  수혜 기관
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6C757D',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  기부를 받는 비영리 단체
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePreviousStep}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#6C757D',
                backgroundColor: '#F8F9FA',
                border: '1px solid #CED4DA',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E9ECEF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8F9FA'
              }}
            >
              이전
            </button>
          </div>
        )}

        {/* Step 2: 상세 정보 입력 */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#212529',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {userType === 'business' ? '사업자 정보 입력' : '기관 정보 입력'}
            </h2>

            {userType === 'business' ? (
              <>
                {/* 기업 정보 입력 폼 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    기업명 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    placeholder="회사명을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    담당자명 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    required
                    placeholder="대표자명을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    담당자 연락처
                  </label>
                  <input
                    type="tel"
                    value={representativePhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setRepresentativePhone(value)
                    }}
                    placeholder="01000000000"
                    maxLength={11}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    사업자 등록번호
                  </label>
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(e.target.value)}
                    placeholder="000-00-00000"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    웹사이트
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    사업자 등록증 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #CED4DA',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      value={businessLicense ? businessLicense.name : ''}
                      placeholder="파일을 선택하세요"
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: businessLicense ? '#000000' : '#6C757D',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                    <label style={{
                      padding: '12px 20px',
                      backgroundColor: '#02391f',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      borderLeft: '1px solid #CED4DA'
                    }}>
                      파일 선택
                      <input
                        type="file"
                        onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        style={{
                          position: 'absolute',
                          left: '-9999px',
                          opacity: 0
                        }}
                      />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 수혜기관 정보 입력 폼 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    기관명 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    placeholder="기관명을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    기관 유형 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="welfare">사회복지시설</option>
                    <option value="nonprofit">비영리단체</option>
                    <option value="religious">종교단체</option>
                    <option value="education">교육기관</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    담당자명 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={organizationRepName}
                    onChange={(e) => setOrganizationRepName(e.target.value)}
                    required
                    placeholder="대표자명을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    담당자 연락처 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={organizationRepPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setOrganizationRepPhone(value)
                    }}
                    required
                    placeholder="01000000000"
                    maxLength={11}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    주소 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={organizationPostcode}
                      readOnly
                      required
                      placeholder="우편번호"
                      style={{
                        width: '120px',
                        padding: '12px',
                        fontSize: '14px',
                        border: '1px solid #CED4DA',
                        borderRadius: '6px',
                        backgroundColor: '#F8F9FA',
                        color: '#000000',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handlePostcodeSearch}
                      style={{
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#212529',
                        backgroundColor: '#ffd020',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      우편번호 검색
                    </button>
                  </div>
                  <input
                    type="text"
                    value={organizationAddress}
                    readOnly
                    required
                    placeholder="주소"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      backgroundColor: '#F8F9FA',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    웹사이트
                  </label>
                  <input
                    type="url"
                    value={organizationWebsite}
                    onChange={(e) => setOrganizationWebsite(e.target.value)}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    기관 SNS 링크
                  </label>
                  <input
                    type="text"
                    value={organizationSns}
                    onChange={(e) => setOrganizationSns(e.target.value)}
                    placeholder="Instagram, Facebook 등 SNS 링크"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #CED4DA',
                      borderRadius: '6px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#02391f'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CED4DA'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#212529',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    공익법인 설립허가증 <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #CED4DA',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      value={taxExemptCert ? taxExemptCert.name : ''}
                      placeholder="파일을 선택하세요"
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: taxExemptCert ? '#000000' : '#6C757D',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                    <label style={{
                      padding: '12px 20px',
                      backgroundColor: '#02391f',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      borderLeft: '1px solid #CED4DA'
                    }}>
                      파일 선택
                      <input
                        type="file"
                        onChange={(e) => setTaxExemptCert(e.target.files?.[0] || null)}
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{
                          position: 'absolute',
                          left: '-9999px',
                          opacity: 0
                        }}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{ 
                color: '#DC3545', 
                fontSize: '14px', 
                marginBottom: '16px',
                textAlign: 'center',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handlePreviousStep}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E9ECEF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA'
                }}
              >
                이전
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: loading ? '#6C757D' : '#212529',
                  backgroundColor: loading ? '#E9ECEF' : '#ffd020',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
              >
                {loading ? '처리 중...' : userType === 'business' ? '회원가입 완료' : '다음'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: 수혜기관 추가 정보 입력 */}
        {step === 3 && userType === 'beneficiary' && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            await handleSignup()
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#212529',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              추가 정보 입력
            </h2>

            {/* 희망하는 물품 종류 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                희망하는 물품의 종류 (복수 선택 가능) <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { value: '식품', label: '식품 (과잉재고, 유통기한 임박 식품 등)' },
                  { value: '생필품', label: '생필품 (세면도구, 생활용품 등)' },
                  { value: '가구', label: '가구' },
                  { value: '가전제품', label: '가전제품' },
                  { value: '의류', label: '의류' },
                  { value: '기타', label: '기타' }
                ].map(item => (
                  <label key={item.value} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    <input
                      type="checkbox"
                      value={item.value}
                      checked={desiredItems.includes(item.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDesiredItems([...desiredItems, item.value])
                        } else {
                          setDesiredItems(desiredItems.filter(i => i !== item.value))
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ color: '#212529' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 수혜자 유형 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                수혜자 유형 (복수 선택 가능) <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['노인', '아동', '저소득층', '한부모가정', '다문화가정', '노숙인', '장애인', '기타'].map(type => (
                  <label key={type} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    <input
                      type="checkbox"
                      value={type}
                      checked={beneficiaryTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBeneficiaryTypes([...beneficiaryTypes, type])
                        } else {
                          setBeneficiaryTypes(beneficiaryTypes.filter(t => t !== type))
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ color: '#212529' }}>{type}</span>
                  </label>
                ))}
              </div>
              {beneficiaryTypes.includes('기타') && (
                <input
                  type="text"
                  value={otherBeneficiaryType}
                  onChange={(e) => setOtherBeneficiaryType(e.target.value)}
                  placeholder="기타 수혜자 유형을 입력하세요"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #CED4DA',
                    borderRadius: '6px',
                    marginTop: '12px',
                    outline: 'none',
                    color: '#000000',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              )}
            </div>

            {/* 물품 픽업 가능 여부 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                귀 단체에서 물품을 직접 찾아가실 수 있나요? <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  <input
                    type="radio"
                    name="canPickup"
                    value="yes"
                    checked={canPickup === 'yes'}
                    onChange={(e) => setCanPickup(e.target.value)}
                    required
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#212529' }}>예</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  <input
                    type="radio"
                    name="canPickup"
                    value="no"
                    checked={canPickup === 'no'}
                    onChange={(e) => setCanPickup(e.target.value)}
                    required
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#212529' }}>아니오</span>
                </label>
              </div>
            </div>

            {/* 기부금 영수증 발급 가능 여부 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                귀 단체는 기업에 기부금 영수증을 발급하실 수 있나요? <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  <input
                    type="radio"
                    name="canIssueReceipt"
                    value="yes"
                    checked={canIssueReceipt === 'yes'}
                    onChange={(e) => setCanIssueReceipt(e.target.value)}
                    required
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#212529' }}>예</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  <input
                    type="radio"
                    name="canIssueReceipt"
                    value="no"
                    checked={canIssueReceipt === 'no'}
                    onChange={(e) => setCanIssueReceipt(e.target.value)}
                    required
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#212529' }}>아니오</span>
                </label>
              </div>
            </div>

            {/* 추가 요청사항 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                추가 요청사항이나 전달하고 싶은 내용이 있나요? (선택)
              </label>
              <textarea
                value={additionalRequest}
                onChange={(e) => setAdditionalRequest(e.target.value)}
                placeholder="추가로 전달하고 싶은 내용을 입력하세요"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  resize: 'vertical',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#02391f'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 57, 31, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CED4DA'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div style={{ 
                color: '#DC3545', 
                fontSize: '14px', 
                marginBottom: '16px',
                textAlign: 'center',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handlePreviousStep}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#6C757D',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E9ECEF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA'
                }}
              >
                이전
              </button>
              
              <button
                type="submit"
                disabled={loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: (loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt) ? '#6C757D' : '#212529',
                  backgroundColor: (loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt) ? '#E9ECEF' : '#ffd020',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseEnter={(e) => !(loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt) && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => !(loading || desiredItems.length === 0 || beneficiaryTypes.length === 0 || !canPickup || !canIssueReceipt) && (e.currentTarget.style.opacity = '1')}
              >
                {loading ? '회원가입 중...' : '회원가입 완료'}
              </button>
            </div>
          </form>
        )}

        {/* 로그인 링크 */}
        {step === 1 && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            fontSize: '14px',
            color: '#6C757D',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ 
              color: '#02391f', 
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              로그인
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}