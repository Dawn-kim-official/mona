'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestUserPage() {
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [beneficiaryData, setBeneficiaryData] = useState<any>(null)
  const [matchesData, setMatchesData] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      // 1. 현재 사용자 정보
      const { data: { user } } = await supabase.auth.getUser()
      setUserData(user)

      if (!user) return

      // 2. beneficiary 정보
      const { data: beneficiary, error: benError } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('Beneficiary query result:', { beneficiary, benError })
      setBeneficiaryData(beneficiary)

      if (!beneficiary) return

      // 3. donation_matches 정보
      const { data: matches, error: matchError } = await supabase
        .from('donation_matches')
        .select('*')
        .eq('beneficiary_id', beneficiary.id)

      console.log('Matches query result:', { matches, matchError })
      setMatchesData(matches || [])
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>수혜기관 사용자 테스트</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>현재 사용자</h2>
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>수혜기관 정보</h2>
        <pre>{JSON.stringify(beneficiaryData, null, 2)}</pre>
      </div>

      <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>매칭 정보 ({matchesData.length}개)</h2>
        <pre>{JSON.stringify(matchesData, null, 2)}</pre>
      </div>
    </div>
  )
}