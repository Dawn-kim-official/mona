'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupBeneficiaryPage() {
  // 단계 관리
  const [step, setStep] = useState(1)
  
  // Step 1: 계정 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Step 2: 기관 정보
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [representativePhone, setRepresentativePhone] = useState('')
  const [representativeEmail, setRepresentativeEmail] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [address, setAddress] = useState('')
  
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

    // 필수 필드 검증
    if (!organizationName || !representativeName || !representativePhone || !representativeEmail || !address) {
      setError('모든 필수 정보를 입력해주세요')
      setLoading(false)
      return
    }

    try {
      console.log('Starting beneficiary signup...', {
        email: email.trim().toLowerCase(),
        organizationName,
        representativeName
      })
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      })
      
      console.log('Auth signup response:', { data, error })

      if (error) {
        console.error('Signup error details:', {
          error,
          message: error.message,
          status: error.status,
          code: error.code
        })
        
        if (error.message.includes('already registered')) {
          throw new Error('이미 등록된 이메일입니다.')
        } else if (error.message.includes('Email signups are disabled')) {
          throw new Error('이메일 회원가입이 비활성화되어 있습니다. 관리자에게 문의하세요.')
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('회원가입에 실패했습니다. 다시 시도해주세요.')
        }
        throw error
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id)
        
        // Create profile with beneficiary role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: 'beneficiary'
          })
        
        console.log('Profile insert result:', { profileError })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          // 이미 존재하는 프로필인 경우 무시
          if (!profileError.message.includes('duplicate')) {
            throw profileError
          }
        }

        // Create beneficiary record
        console.log('Creating beneficiary record...')
        const { error: beneficiaryError } = await supabase
          .from('beneficiaries')
          .insert({
            user_id: data.user.id,
            organization_name: organizationName,
            organization_type: organizationType || null,
            representative_name: representativeName,
            email: representativeEmail,
            phone: representativePhone,
            address: address,
            registration_number: registrationNumber || null,
            status: 'pending'
          })
        
        console.log('Beneficiary insert result:', { beneficiaryError })
        
        if (beneficiaryError) {
          console.error('Beneficiary creation error:', beneficiaryError)
          throw beneficiaryError
        }
        
        // 회원가입 성공 후 처리
        alert('회원가입이 완료되었습니다.\n\n담당자가 기관 정보를 확인 후 승인 처리할 예정입니다.\n승인 완료 시 이메일로 안내드리겠습니다.')
        router.push('/login')
      }
    } catch (error: any) {
      console.error('Signup process error:', error)
      setError(error.message || '회원가입 중 오류가 발생했습니다.')
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
          }}>수혜 기관 회원가입</h1>
          <p style={{ 
            color: '#6C757D', 
            fontSize: '14px' 
          }}>
            {step === 1 ? '계정 정보를 입력해주세요.' : '기관 정보를 정확하게 입력해주세요.'}
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
                기관명 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                placeholder="○○복지관"
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
                기관 유형
              </label>
              <select
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: '#FFFFFF',
                  color: '#212529',
                  cursor: 'pointer'
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
                <option value="">선택하세요</option>
                <option value="복지관">복지관</option>
                <option value="NGO">NGO</option>
                <option value="사회복지기관">사회복지기관</option>
                <option value="기타">기타</option>
              </select>
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
                담당자 전화번호 <span style={{ color: '#DC3545' }}>*</span>
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
                담당자 이메일 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="email"
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                required
                placeholder="contact@organization.org"
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
                고유번호/사업자등록번호
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#212529'
              }}>
                주소 <span style={{ color: '#DC3545' }}>*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="서울시 ○○구 ○○로 123"
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
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handlePreviousStep}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#6C757D',
                  backgroundColor: 'white',
                  border: '1px solid #6C757D',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                이전
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
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
            </div>
          </form>
        )}
      </div>
    </div>
  )
}