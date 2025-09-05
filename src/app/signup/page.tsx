'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  // 단계 관리
  const [step, setStep] = useState(1)
  
  // Step 1: 계정 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Step 2: 사업자 정보
  const [businessName, setBusinessName] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [representativePhone, setRepresentativePhone] = useState('')
  const [representativeEmail, setRepresentativeEmail] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

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

    // 2단계로 진행
    setStep(2)
  }

  const handlePreviousStep = () => {
    setStep(1)
    setError(null)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 필수 필드 검증 (파일 제외)
    if (!businessName || !representativeName || !representativePhone || !representativeEmail || !businessNumber) {
      setError('모든 필수 정보를 입력해주세요')
      setLoading(false)
      return
    }

    try {
      
      // 먼저 이메일 중복 체크
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .single()
      
      if (existingUser) {
        setError('이미 등록된 이메일입니다. 로그인 페이지에서 로그인해주세요.')
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirm: false
          }
        },
      })

      if (error) {
        // Signup error
        // Supabase는 이미 가입된 이메일에 대해 다양한 메시지를 반환할 수 있음
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered') ||
            error.message.includes('duplicate key value') ||
            error.code === '23505') {
          throw new Error('이미 등록된 이메일입니다. 로그인 페이지에서 로그인해주세요.')
        }
        throw error
      }

      if (data.user) {
        // Create profile - admin@mona.com은 자동으로 admin 권한
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: data.user.email === 'admin@mona.com' ? 'admin' : 'business'
          })
        
        if (profileError) {
          // Profile creation error
          // 이미 존재하는 프로필인 경우 무시
          if (!profileError.message.includes('duplicate')) {
            throw profileError
          }
        }

        // Upload business license
        let businessLicenseUrl = ''
        if (businessLicense) {
          const fileExt = businessLicense.name.split('.').pop()
          const fileName = `${data.user.id}_${Date.now()}.${fileExt}`
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('business-licenses')
            .upload(fileName, businessLicense)
          
          if (uploadError) {
            // Upload error
            throw uploadError
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('business-licenses')
            .getPublicUrl(fileName)
          
          businessLicenseUrl = publicUrl
        }

        // admin 계정이 아닌 경우에만 business 정보 생성
        if (data.user.email !== 'admin@mona.com') {
          // Create business record
          const { error: businessError } = await supabase
            .from('businesses')
            .insert({
              user_id: data.user.id,
              name: businessName,
              representative_name: representativeName,
              business_license_url: businessLicenseUrl,
              email: representativeEmail,
              phone: representativePhone,
              address: businessNumber, // 사업자 등록번호를 address 필드에 임시 저장
              website: website || null,
              status: 'pending',
              contract_signed: false,
              approved_at: null
            })
          
          if (businessError) {
            // Business creation error
            throw businessError
          }
        }
        
        // admin이 아닌 경우 로그인하지 않고 승인 대기 안내
        if (data.user.email === 'admin@mona.com') {
          // admin은 바로 로그인
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (!signInError) {
            router.push('/admin/dashboard')
          }
        } else {
          // 일반 사용자는 로그아웃 후 승인 대기 안내
          await supabase.auth.signOut()
          alert('회원가입이 완료되었습니다.\n\n담당자가 사업자 정보를 확인 후 승인 처리할 예정입니다.\n승인 완료 시 이메일로 안내드리겠습니다.')
          router.push('/login')
        }
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
        padding: '40px'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '8px',
            color: '#212529'
          }}>회원가입</h1>
          <p style={{ 
            color: '#6C757D', 
            fontSize: '14px' 
          }}>
            {step === 1 ? '' : '정확한 사업자 정보를 입력해주세요.'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: '#6C757D' }}>{step}/2단계</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
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
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                비밀번호 확인
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
                  color: '#212529'
                }}
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
            
            {error && (
              <div style={{ 
                color: '#DC3545', 
                fontSize: '14px', 
                marginBottom: '16px',
                textAlign: 'center' 
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#212529',
                backgroundColor: '#FFC107',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
            >
              다음 단계
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                사업자명 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="주식회사 모나"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                담당자명 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                required
                placeholder="홍길동"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                담당자 전화번호
              </label>
              <input
                type="tel"
                value={representativePhone}
                onChange={(e) => setRepresentativePhone(e.target.value)}
                required
                placeholder="010-1234-5678"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                담당자 이메일
              </label>
              <input
                type="email"
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                required
                placeholder="contact@company.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                사업자등록번호
              </label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                required
                placeholder="123-45-67890"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                회사 웹사이트 또는 SNS
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529'
                }}
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
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                사업자등록증 업로드 <span style={{ color: '#DC3545' }}>*</span> (jpg, pdf)
              </label>
              <div style={{
                border: '2px dashed #DEE2E6',
                borderRadius: '4px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#F8F9FA',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                <p style={{ color: '#6C757D', fontSize: '14px', marginBottom: '4px' }}>
                  클릭하여 업로드 또는 파일을 드래그하세요.
                </p>
                {businessLicense ? (
                  <p style={{ color: '#28A745', fontSize: '12px' }}>
                    {businessLicense.name} ({(businessLicense.size / 1024).toFixed(1)}KB)
                  </p>
                ) : (
                  <p style={{ color: '#6C757D', fontSize: '12px' }}>최대 5MB</p>
                )}
              </div>
            </div>
            
            {error && (
              <div style={{ 
                color: '#DC3545', 
                fontSize: '14px', 
                marginBottom: '16px',
                textAlign: 'center' 
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#212529',
                backgroundColor: '#FFC107',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FFB300')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FFC107')}
            >
              {loading ? '가입 중...' : '회원가입 완료'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}