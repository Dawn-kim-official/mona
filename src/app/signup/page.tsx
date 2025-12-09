'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import Footer from '@/components/Footer'

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
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('')  // 등록번호
  const [website, setWebsite] = useState('')
  const [snsLink, setSnsLink] = useState('')  // SNS 링크
  const [address, setAddress] = useState('')  // 주소
  const [postcode, setPostcode] = useState('')  // 우편번호
  const [detailAddress, setDetailAddress] = useState('')  // 상세주소
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  
  // 수혜기관 정보
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState('')
  const [organizationRepName, setOrganizationRepName] = useState('')
  const [organizationRepPhone, setOrganizationRepPhone] = useState('')
  const [organizationAddress, setOrganizationAddress] = useState('')
  const [organizationPostcode, setOrganizationPostcode] = useState('')
  const [organizationDetailAddress, setOrganizationDetailAddress] = useState('')
  const [organizationWebsite, setOrganizationWebsite] = useState('')
  const [organizationSns, setOrganizationSns] = useState('')
  const [taxExemptCert, setTaxExemptCert] = useState<File | null>(null)
  
  // 수혜기관 추가 정보
  const [desiredItems, setDesiredItems] = useState<string[]>([])
  const [otherDesiredItem, setOtherDesiredItem] = useState('')  // 희망물품 기타 입력
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
          if (userType === 'business') {
            setPostcode(data.zonecode)
            setAddress(data.roadAddress || data.jibunAddress)
          } else {
            setOrganizationPostcode(data.zonecode)
            setOrganizationAddress(data.roadAddress || data.jibunAddress)
          }
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
      // Step 2에서 이전으로 갈 때 파일 상태 초기화
      setBusinessLicense(null)
      setTaxExemptCert(null)
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

    // 통합 필수 항목 검증
    if (userType === 'business') {
      if (!businessName || !businessRegistrationNumber || !address || !businessLicense || !representativeName || !representativePhone) {
        setError('기관명, 등록번호, 주소, 등록증, 담당자명, 담당자 전화번호는 필수 항목입니다.')
        setLoading(false)
        return
      }
    } else {
      if (!organizationName || !businessRegistrationNumber || !organizationAddress || !taxExemptCert || !organizationRepName || !organizationRepPhone) {
        setError('기관명, 등록번호, 주소, 등록증, 담당자명, 담당자 전화번호는 필수 항목입니다.')
        setLoading(false)
        return
      }
    }

    try {
      let userId = null
      let isRejectedAccount = false

      console.log('Checking email:', email.trim().toLowerCase())

      // 먼저 해당 이메일로 가입된 계정의 상태 확인
      const { data: existingUser, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email.trim().toLowerCase())
        .single()

      console.log('Profile check result:', existingUser, 'Error:', profileError)

      if (existingUser) {
        // 거절된 계정인지 확인
        if (existingUser.role === 'business' || userType === 'business') {
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('status')
            .eq('user_id', existingUser.id)
            .single()

          console.log('Business check:', business, 'Error:', businessError)

          // 406 에러나 데이터가 없는 경우 처리
          if (businessError?.code === 'PGRST116' || businessError?.message?.includes('Row not found')) {
            // businesses 테이블에 데이터가 없는 경우 - 계정 재사용 가능
            isRejectedAccount = true
            userId = existingUser.id
            console.log('No business data found, can reuse account')
          } else if (business?.status === 'rejected') {
            isRejectedAccount = true
            userId = existingUser.id
            // 거절된 기업 데이터 삭제
            await supabase.from('businesses').delete().eq('user_id', existingUser.id)
          } else if (business) {
            // 승인 대기 중이거나 승인된 계정
            setError('이미 등록된 이메일입니다.')
            setLoading(false)
            return
          } else {
            // 기타 에러인 경우 계정 재사용
            isRejectedAccount = true
            userId = existingUser.id
          }
        } else if (existingUser.role === 'beneficiary' || userType === 'beneficiary') {
          const { data: beneficiary, error: beneficiaryError } = await supabase
            .from('beneficiaries')
            .select('status')
            .eq('user_id', existingUser.id)
            .single()

          console.log('Beneficiary check:', beneficiary, 'Error:', beneficiaryError)

          // 406 에러나 데이터가 없는 경우 처리
          if (beneficiaryError?.code === 'PGRST116' || beneficiaryError?.message?.includes('Row not found')) {
            // beneficiaries 테이블에 데이터가 없는 경우 - 계정 재사용 가능
            isRejectedAccount = true
            userId = existingUser.id
            console.log('No beneficiary data found, can reuse account')
          } else if (beneficiary?.status === 'rejected') {
            isRejectedAccount = true
            userId = existingUser.id
            // 거절된 수혜기관 데이터 삭제
            await supabase.from('beneficiaries').delete().eq('user_id', existingUser.id)
          } else if (beneficiary) {
            // 승인 대기 중이거나 승인된 계정
            setError('이미 등록된 이메일입니다.')
            setLoading(false)
            return
          } else {
            // 기타 에러인 경우 계정 재사용
            isRejectedAccount = true
            userId = existingUser.id
          }
        }

        if (isRejectedAccount) {
          // 거절된 계정인 경우 프로필 업데이트 (role 변경 가능)
          await supabase
            .from('profiles')
            .update({
              role: userType === 'business' ? 'business' : 'beneficiary',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          // 기존 Auth 사용자로 로그인 시도
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          })

          if (signInError) {
            // 비밀번호가 틀린 경우
            setError('거절된 계정입니다. 이전과 동일한 비밀번호를 사용해주세요.')
            setLoading(false)
            return
          }

          // 로그인 성공 - userId 사용
        }
      }

      // 신규 계정 생성 (거절된 계정이 아닌 경우)
      if (!isRejectedAccount) {
        console.log('Attempting to create new account for:', email)

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

        console.log('SignUp result:', data, 'Error:', signupError)

        if (signupError) {
          console.error('SignUp error details:', signupError)
          if (signupError.message.includes('already registered') ||
              signupError.message.includes('User already registered')) {

            // Auth에는 있지만 profiles에는 없는 경우 - Auth 사용자로 로그인 시도
            console.log('User exists in Auth but not in profiles, attempting signin...')
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password
            })

            if (signInError) {
              console.error('SignIn also failed:', signInError)
              throw new Error('이미 등록된 이메일입니다. 비밀번호를 확인해주세요.')
            }

            if (signInData?.user) {
              console.log('SignIn successful, reusing user:', signInData.user.id)
              userId = signInData.user.id
              // 이 경우 프로필을 새로 만들어야 함
            } else {
              throw new Error('이미 등록된 이메일입니다.')
            }
          } else {
            throw signupError
          }
        } else {
          userId = data?.user?.id
        }
      }

      if (userId) {
        // 프로필이 없는 경우 생성 (신규 또는 Auth만 있는 경우)
        if (!isRejectedAccount || !existingUser) {
          console.log('Creating/updating profile for user:', userId)

          // 먼저 프로필이 있는지 확인
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single()

          if (!existingProfile) {
            // 프로필이 없으면 생성
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: email.trim().toLowerCase(),
                role: userType === 'business' ? 'business' : 'beneficiary'
              })

            if (profileError) {
              console.error('Profile creation error:', profileError)
            } else {
              console.log('Profile created successfully')
            }
          } else {
            // 프로필이 있으면 업데이트
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                role: userType === 'business' ? 'business' : 'beneficiary',
                email: email.trim().toLowerCase()
              })
              .eq('id', userId)

            if (updateError) {
              console.error('Profile update error:', updateError)
            } else {
              console.log('Profile updated successfully')
            }
          }
        }

        // 파일 업로드 처리
        let fileUrl = null
        
        if (userType === 'business') {
          // 사업자등록증 업로드
          if (businessLicense) {
            const fileExt = businessLicense.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`
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
          const businessData = {
            user_id: userId,
            name: businessName,
            email: email.trim().toLowerCase() || '',  // 이메일 추가
            representative_name: representativeName,
            phone: representativePhone || '',
            business_registration_number: businessRegistrationNumber || '',  // 새 필드
            manager_name: representativeName,
            manager_phone: representativePhone || '',
            business_license_url: fileUrl || '',
            website: website || '',
            sns_link: snsLink || '',  // 새 필드
            address: address || '',  // 메인 주소 추가
            postcode: postcode || '',  // 새 필드
            detail_address: detailAddress || '',  // 새 필드
            status: 'pending',
            contract_signed: false,
            approved_at: null
          }

          const { error: businessError } = await supabase
            .from('businesses')
            .insert(businessData)
          
          if (businessError) {
            throw businessError
          }
        } else {
          // 수혜기관 - 공익법인 설립허가증 업로드
          if (taxExemptCert) {
            const fileExt = taxExemptCert.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`
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
              user_id: userId,
              organization_name: organizationName,
              organization_type: organizationType || '',
              representative_name: organizationRepName,  // 담당자명 (필드명 수정)
              phone: organizationRepPhone || '',  // 담당자 연락처 (필드명 수정)
              email: email.trim().toLowerCase() || '',  // 이메일 추가
              registration_number: businessRegistrationNumber || '',  // 등록번호
              tax_exempt_cert_url: fileUrl || '',
              address: organizationAddress || '',
              postcode: organizationPostcode || '',
              detail_address: organizationDetailAddress || '',  // 새 필드
              website: organizationWebsite || '',
              sns_link: organizationSns || '',
              desired_items: desiredItems.includes('기타') && otherDesiredItem
                ? [...desiredItems.filter(i => i !== '기타'), otherDesiredItem]
                : desiredItems,
              beneficiary_types: beneficiaryTypes.includes('기타') && otherBeneficiaryType
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

        // 어드민에게 회원가입 승인 요청 이메일 발송
        try {
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@mona.ai.kr'
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminEmail,
              type: 'admin_signup_request',
              memberType: userType === 'business' ? '기업' : '수혜기관',
              organizationName: userType === 'business' ? businessName : organizationName,
              signupDate: new Date().toLocaleDateString('ko-KR')
            })
          })
        } catch (emailError) {
          console.error('회원가입 알림 이메일 발송 실패:', emailError)
          // 이메일 실패해도 회원가입은 성공으로 처리
        }

        // 로그아웃 후 승인 대기 안내
        await supabase.auth.signOut()
        alert(`회원가입이 완료되었습니다.\n\n담당자가 ${userType === 'business' ? '사업자' : '기관'} 정보를 확인 후 승인 처리할 예정입니다.\n승인 완료 시 이메일로 안내드리겠습니다.`)
        router.push('/login')
      } else {
        throw new Error('회원가입 처리 중 오류가 발생했습니다.')
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
      flexDirection: 'column'
    }}>
      <div style={{
        flex: 1,
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
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <Image
            src="/mona_logo.png"
            alt="MONA Logo"
            width={120}
            height={120}
            style={{ marginBottom: '16px' }}
          />
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

            {/* 기관명 - 필수 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                기관/기업명 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={userType === 'business' ? businessName : organizationName}
                onChange={(e) => userType === 'business' ? setBusinessName(e.target.value) : setOrganizationName(e.target.value)}
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

            {/* 등록번호 - 필수 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                등록번호 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={businessRegistrationNumber}
                onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                required
                placeholder={userType === 'business' ? "사업자등록번호를 입력하세요" : "기관등록번호를 입력하세요"}
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

            {/* 웹사이트 URL - 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                웹사이트 URL
              </label>
              <input
                type="url"
                value={userType === 'business' ? website : organizationWebsite}
                onChange={(e) => userType === 'business' ? setWebsite(e.target.value) : setOrganizationWebsite(e.target.value)}
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

            {/* SNS 링크 - 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                SNS 링크
              </label>
              <input
                type="url"
                value={userType === 'business' ? snsLink : organizationSns}
                onChange={(e) => userType === 'business' ? setSnsLink(e.target.value) : setOrganizationSns(e.target.value)}
                placeholder="인스타그램, 페이스북 등 SNS 링크"
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

            {/* 주소 - 필수 */}
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
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={userType === 'business' ? postcode : organizationPostcode}
                  readOnly
                  required
                  placeholder="우편번호"
                  style={{
                    width: '120px',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #CED4DA',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#000000',
                    backgroundColor: '#F8F9FA',
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
                    color: 'white',
                    backgroundColor: '#02391f',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
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
                value={userType === 'business' ? address : organizationAddress}
                required
                readOnly
                placeholder="기본주소"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  color: '#000000',
                  backgroundColor: '#F8F9FA',
                  marginBottom: '10px',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              <input
                type="text"
                value={userType === 'business' ? detailAddress : organizationDetailAddress}
                onChange={(e) => userType === 'business' ? setDetailAddress(e.target.value) : setOrganizationDetailAddress(e.target.value)}
                placeholder="상세주소를 입력하세요"
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

            {/* 등록증 업로드 - 필수 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                등록증 업로드 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (userType === 'business') {
                    setBusinessLicense(file || null)
                  } else {
                    setTaxExemptCert(file || null)
                  }
                }}
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
              />
              <small style={{ fontSize: '12px', color: '#6C757D', marginTop: '4px', display: 'block' }}>
                {userType === 'business' ? '사업자등록증' : '고유번호증 또는 비영리단체 등록증'}을 업로드해주세요 (PDF, JPG, PNG)
              </small>
            </div>

            {/* 담당자명 - 필수 */}
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
                value={userType === 'business' ? representativeName : organizationRepName}
                onChange={(e) => userType === 'business' ? setRepresentativeName(e.target.value) : setOrganizationRepName(e.target.value)}
                required
                placeholder="담당자 이름을 입력하세요"
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

            {/* 담당자 전화번호 - 필수 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                담당자 전화번호 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="tel"
                value={userType === 'business' ? representativePhone : organizationRepPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (userType === 'business') {
                    setRepresentativePhone(value)
                  } else {
                    setOrganizationRepPhone(value)
                  }
                }}
                required
                placeholder="01012345678 (숫자만 입력)"
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

            {/* 버튼 영역 */}
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
              {desiredItems.includes('기타') && (
                <input
                  type="text"
                  value={otherDesiredItem}
                  onChange={(e) => setOtherDesiredItem(e.target.value)}
                  placeholder="기타 희망물품을 입력하세요"
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
      <Footer />
    </div>
  )
}