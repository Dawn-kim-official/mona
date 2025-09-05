'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function testLogin() {
    setLoading(true)
    try {
      // 환경 변수 확인
      
      // 먼저 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession()

      // 로그아웃 먼저 시도
      await supabase.auth.signOut()

      // 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: '123123'
      })

      setResult({
        success: !error,
        data: data,
        error: error,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorCode: error?.code,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      })

    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        stack: err.stack,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      })
    } finally {
      setLoading(false)
    }
  }

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    setResult({
      user,
      session,
      authenticated: !!user
    })
  }

  async function testSignOut() {
    const { error } = await supabase.auth.signOut()
    setResult({
      signedOut: !error,
      error
    })
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Login & Auth</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Testing...' : 'Test Login (test@test.com / 123123)'}
        </button>
        
        <button 
          onClick={checkAuth}
          style={{ padding: '10px 20px' }}
        >
          Check Current Auth
        </button>
        
        <button 
          onClick={testSignOut}
          style={{ padding: '10px 20px' }}
        >
          Sign Out
        </button>
      </div>
      
      {result && (
        <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}