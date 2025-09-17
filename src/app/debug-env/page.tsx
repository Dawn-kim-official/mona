'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DebugEnvPage() {
  const [testResult, setTestResult] = useState<any>(null)
  
  async function testSupabaseConnection() {
    try {
      const supabase = createClient()
      
      // Test a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      setTestResult({
        success: !error,
        data,
        error,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message,
        stack: err.stack
      })
    }
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variables Debug</h1>
      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong></p>
        <code style={{ wordBreak: 'break-all' }}>{process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</code>
        
        <p style={{ marginTop: '20px' }}><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong></p>
        <code style={{ wordBreak: 'break-all' }}>
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50) + '...' : 
            'NOT SET'}
        </code>
        
        <p style={{ marginTop: '20px' }}><strong>URL Type:</strong> {typeof process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>URL Length:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0}</p>
        <p><strong>Key Length:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0}</p>
      </div>
      
      <button 
        onClick={testSupabaseConnection}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#ffd020',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Test Supabase Connection
      </button>
      
      {testResult && (
        <pre style={{ 
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da', 
          padding: '20px', 
          marginTop: '20px',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          {JSON.stringify(testResult, null, 2)}
        </pre>
      )}
    </div>
  )
}