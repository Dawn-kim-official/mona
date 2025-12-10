'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || '비밀번호 재설정 요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #02391f 0%, #034d29 100%)',
      padding: '20px',
      fontFamily: 'Montserrat, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '48px',
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* 로고 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#02391f',
            margin: 0,
            fontFamily: 'Montserrat, sans-serif'
          }}>MONA</h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '8px',
            fontWeight: 500
          }}>비밀번호 찾기</p>
        </div>

        {success ? (
          <div>
            <div style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#155724',
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.6',
                fontWeight: 500
              }}>
                비밀번호 재설정 링크가 이메일로 발송되었습니다.<br />
                이메일을 확인하여 비밀번호를 재설정해주세요.
              </p>
            </div>
            <Link href="/login">
              <button style={{
                width: '100%',
                padding: '14px',
                background: '#02391f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                로그인 페이지로 돌아가기
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontSize: '14px',
                fontWeight: 600
              }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="가입한 이메일을 입력하세요"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Montserrat, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#02391f'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {error && (
              <div style={{
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{
                  color: '#721c24',
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#ccc' : '#02391f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {loading ? '전송 중...' : '비밀번호 재설정 링크 받기'}
            </button>

            <div style={{
              textAlign: 'center',
              marginTop: '24px'
            }}>
              <Link
                href="/login"
                style={{
                  color: '#02391f',
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
