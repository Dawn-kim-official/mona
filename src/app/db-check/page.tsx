'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function DBCheckPage() {
  const supabase = createClient()
  const [businessesSchema, setBusinessesSchema] = useState<any[]>([])
  const [businessesData, setBusinessesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabase()
  }, [])

  async function checkDatabase() {
    try {
      // 1. businesses 테이블의 스키마 확인
      const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_schema', {
        table_name: 'businesses'
      })

      if (schemaError) {
        console.error('Schema query failed:', schemaError)
        
        // RPC가 없을 경우, 실제 데이터를 조회해서 컬럼 확인
        const { data: sampleData, error: dataError } = await supabase
          .from('businesses')
          .select('*')
          .limit(1)

        if (!dataError && sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0])
          setBusinessesSchema(columns.map(col => ({ column_name: col })))
        }
      } else {
        setBusinessesSchema(schemaData || [])
      }

      // 2. businesses 테이블의 실제 데이터 확인
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .limit(5)

      if (businessError) {
        setError(`Business data error: ${businessError.message}`)
      } else {
        setBusinessesData(businessData || [])
      }

    } catch (err) {
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Database Structure Check</h1>
      
      <h2>Businesses Table Schema</h2>
      {businessesData.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3>Available Columns:</h3>
          <ul>
            {Object.keys(businessesData[0]).map(col => (
              <li key={col}>
                <strong>{col}</strong>: {typeof businessesData[0][col]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2>Sample Data (First 5 records)</h2>
      <pre style={{ backgroundColor: '#f4f4f4', padding: '20px', overflow: 'auto' }}>
        {JSON.stringify(businessesData, null, 2)}
      </pre>

      <h2>Missing Columns Check</h2>
      <div>
        {['business_registration_number', 'manager_name', 'manager_phone', 'postcode', 'detail_address', 'sns_link'].map(field => {
          const exists = businessesData.length > 0 && field in businessesData[0]
          return (
            <div key={field}>
              {field}: <span style={{ color: exists ? 'green' : 'red' }}>
                {exists ? '✓ EXISTS' : '✗ MISSING'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}