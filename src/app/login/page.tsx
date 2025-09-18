'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 로그인 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
        }
        throw authError
      }

      if (authData.user) {
        // 사용자의 role 확인
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (!profile) {
          throw new Error('프로필을 찾을 수 없습니다.')
        }

        // role에 따라 다른 페이지로 리다이렉트
        switch (profile.role) {
          case 'admin':
            router.push('/admin/dashboard')
            break
          case 'business':
            // 기업 승인 상태 확인
            const { data: business } = await supabase
              .from('businesses')
              .select('status')
              .eq('user_id', authData.user.id)
              .single()
            
            if (business?.status === 'pending') {
              await supabase.auth.signOut()
              alert('회원가입 승인 대기 중입니다.\n승인 완료 시 이메일로 안내드리겠습니다.')
              setEmail('')
              setPassword('')
              return
            } else if (business?.status === 'rejected') {
              await supabase.auth.signOut()
              alert('회원가입이 거절되었습니다.\n관리자에게 문의하세요.')
              setEmail('')
              setPassword('')
              return
            }
            router.push('/business/dashboard')
            break
          case 'beneficiary':
            // 수혜기관 승인 상태 확인
            const { data: beneficiary } = await supabase
              .from('beneficiaries')
              .select('status')
              .eq('user_id', authData.user.id)
              .single()
            
            if (beneficiary?.status === 'pending') {
              await supabase.auth.signOut()
              alert('회원가입 승인 대기 중입니다.\n승인 완료 시 이메일로 안내드리겠습니다.')
              setEmail('')
              setPassword('')
              return
            } else if (beneficiary?.status === 'rejected') {
              await supabase.auth.signOut()
              alert('회원가입이 거절되었습니다.\n관리자에게 문의하세요.')
              setEmail('')
              setPassword('')
              return
            }
            router.push('/beneficiary/dashboard')
            break
          default:
            throw new Error('알 수 없는 사용자 유형입니다.')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || '로그인에 실패했습니다.')
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
        padding: '48px',
        width: '100%',
        maxWidth: '440px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold', 
            color: '#ffd020',
            marginBottom: '8px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            MONA
          </h1>
          <p style={{ 
            color: '#6C757D', 
            fontSize: '14px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            모두의 나눔, 함께하는 기부
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="이메일 주소를 입력하세요"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
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
                padding: '12px 16px',
                fontSize: '15px',
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
              padding: '12px',
              backgroundColor: '#F8D7DA',
              border: '1px solid #F5C6CB',
              borderRadius: '6px',
              color: '#721C24',
              fontSize: '14px',
              marginBottom: '20px',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
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
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#6C757D',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            아직 계정이 없으신가요?
          </p>
          <Link href="/signup" style={{
            color: '#02391f',
            fontSize: '14px',
            fontWeight: '500',
            textDecoration: 'none',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            회원가입하기 →
          </Link>
        </div>
      </div>
    </div>
  )
}