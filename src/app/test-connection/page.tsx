'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<string>('Checking...')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    try {
      const supabase = createClient()
      
      // 1. 연결 테스트
      const { data: testData, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) {
        setStatus(`Error: ${error.message}`)
        return
      }

      setStatus('Connected successfully!')
      setData(testData)

      // 2. Auth 상태 확인
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)

    } catch (err: any) {
      setStatus(`Exception: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      <p>Status: {status}</p>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}