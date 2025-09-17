'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'business' | 'beneficiary' | 'admin'>('business')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
        }
        throw error
      }

      if (data.user) {
        // profiles 테이블에서 role 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          // profile이 없으면 생성
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              role: 'business'
            })
        }

        // role에 따라 리다이렉트
        if (profile?.role === 'admin' || userType === 'admin') {
          router.push('/admin/dashboard')
        } else if (profile?.role === 'beneficiary' || userType === 'beneficiary') {
          // beneficiary 사용자인 경우
          const { data: beneficiary } = await supabase
            .from('beneficiaries')
            .select('id, status')
            .eq('user_id', data.user.id)
            .single()

          if (!beneficiary) {
            setError('수혜자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
            return
          } else if (beneficiary.status === 'pending') {
            router.push('/registration-pending')
          } else if (beneficiary.status === 'rejected') {
            setError('회원가입이 거절되었습니다. 관리자에게 문의하세요.')
            await supabase.auth.signOut()
            return
          } else if (beneficiary.status === 'approved') {
            router.push('/beneficiary/dashboard')
          }
        } else {
          // business 사용자인 경우 등록 여부 확인
          const { data: business } = await supabase
            .from('businesses')
            .select('id, status')
            .eq('user_id', data.user.id)
            .single()

          if (!business) {
            // 회원가입 시 이미 사업자 정보를 입력받았으므로, business가 없는 경우는 오류
            setError('사업자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
            return
          } else if (business.status === 'pending') {
            // 승인 대기 중인 경우
            router.push('/registration-pending')
          } else if (business.status === 'rejected') {
            // 승인 거절된 경우
            setError('회원가입이 거절되었습니다. 관리자에게 문의하세요.')
            await supabase.auth.signOut()
            return
          } else if (business.status === 'approved') {
            // 승인된 경우만 대시보드로 이동
            router.push('/business/dashboard')
          }
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
        maxWidth: '400px',
        padding: '40px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            color: '#ffd020', 
            fontSize: '36px', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>MONA</h1>
          <p style={{ 
            color: '#6C757D', 
            fontSize: '14px' 
          }}>기업 ESG 경영을 위한 기부 관리 플랫폼</p>
        </div>

        {/* 사용자 유형 선택 탭 */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '24px',
          borderBottom: '1px solid #DEE2E6'
        }}>
          <button
            type="button"
            onClick={() => setUserType('business')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: userType === 'business' ? '2px solid #02391f' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: userType === 'business' ? '#02391f' : '#6C757D',
              fontWeight: userType === 'business' ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            기부 기업
          </button>
          <button
            type="button"
            onClick={() => setUserType('beneficiary')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: userType === 'beneficiary' ? '2px solid #02391f' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: userType === 'beneficiary' ? '#02391f' : '#6C757D',
              fontWeight: userType === 'beneficiary' ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            수혜 기관
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: userType === 'admin' ? '2px solid #02391f' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: userType === 'admin' ? '#02391f' : '#6C757D',
              fontWeight: userType === 'admin' ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            관리자
          </button>
        </div>

        <form onSubmit={handleLogin}>
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
                color: '#212529'
              }}
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
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호를 입력하세요"
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
                e.currentTarget.style.borderColor = '#02391f'
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
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#212529',
              backgroundColor: '#ffd020',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {userType !== 'admin' && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            fontSize: '14px',
            color: '#6C757D'
          }}>
            {userType === 'business' 
              ? '회원가입 후 사업자 정보를 등록하여 서비스를 이용하실 수 있습니다.'
              : '회원가입 후 기관 정보를 등록하여 서비스를 이용하실 수 있습니다.'}
            <br />
            <Link 
              href={userType === 'business' ? '/signup' : '/signup-beneficiary'} 
              style={{ 
                color: '#007BFF', 
                textDecoration: 'none',
                marginTop: '8px',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              회원가입
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}