'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Business = Database['public']['Tables']['businesses']['Row']

export default function AdminBusinessesPage() {
  const supabase = createClient()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchBusinesses()
  }, [filter])

  async function fetchBusinesses() {
    setLoading(true)
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching businesses:', error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
  }

  async function updateBusinessStatus(businessId: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('businesses')
      .update({ 
        status, 
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', businessId)

    if (error) {
      console.error('Error updating business:', error)
    } else {
      fetchBusinesses()
    }
  }

  return (
    <div>
      <h2>사업자 관리</h2>

      <div>
        <button onClick={() => setFilter('all')}>전체</button>
        <button onClick={() => setFilter('pending')}>승인 대기</button>
        <button onClick={() => setFilter('approved')}>승인됨</button>
        <button onClick={() => setFilter('rejected')}>거절됨</button>
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : businesses.length === 0 ? (
        <p>해당하는 사업자가 없습니다.</p>
      ) : (
        <div>
          {businesses.map((business) => (
            <div key={business.id}>
              <h3>{business.name}</h3>
              <p>대표자명: {business.representative_name}</p>
              <p>이메일: {business.email}</p>
              <p>전화번호: {business.phone}</p>
              <p>주소: {business.address}</p>
              <p>상태: {business.status}</p>
              
              {business.business_license_url && (
                <a href={business.business_license_url} target="_blank" rel="noopener noreferrer">
                  사업자 등록증 보기
                </a>
              )}

              {business.status === 'pending' && (
                <div>
                  <button onClick={() => updateBusinessStatus(business.id, 'approved')}>
                    승인
                  </button>
                  <button onClick={() => updateBusinessStatus(business.id, 'rejected')}>
                    거절
                  </button>
                </div>
              )}

              {business.status === 'approved' && !business.contract_signed && (
                <p>계약서 서명 대기 중</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}