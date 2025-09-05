'use client'

import { useEffect, useState } from 'react'

export default function APITestPage() {
  const [result, setResult] = useState<any>({})

  useEffect(() => {
    testAPI()
  }, [])

  async function testAPI() {
    const url = 'https://ipieplfljolfssmvxpub.supabase.co'
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWVwbGZsam9sZnNzbXZ4cHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjAwMzksImV4cCI6MjA3MDYzNjAzOX0.XyTg4LtzFaXc__e_68Sc6dYLypTbiDXkwTHdossiotE'

    try {
      // 1. 직접 API 호출 테스트
      const response = await fetch(`${url}/rest/v1/profiles?select=*&limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      })

      const data = await response.text()
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      })

      // 2. Auth 테스트
      const authResponse = await fetch(`${url}/auth/v1/user`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      })

      const authData = await authResponse.text()
      // Auth response

    } catch (error: any) {
      setResult({ error: error.message })
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Direct API Test</h1>
      <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
      
      <h2>Environment Check</h2>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
      <p>URL from env: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>Key exists: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
    </div>
  )
}