'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  async function testLogin() {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: '123123'
      })

      setResult({
        success: !error,
        data: data,
        error: error
      })

      console.log('Login result:', { data, error })
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message
      })
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Login</h1>
      <button onClick={testLogin} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Test Login (test@test.com / 123123)
      </button>
      
      {result && (
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}