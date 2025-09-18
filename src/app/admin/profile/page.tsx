'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setEmail(user.email || '')
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setName(profile.name || '')
    }
    
    setLoading(false)
  }

  async function handleUpdate() {
    setUpdating(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)

    if (error) {
      alert('프로필 업데이트 중 오류가 발생했습니다.')
    } else {
      alert('프로필이 성공적으로 업데이트되었습니다.')
    }
    
    setUpdating(false)
  }


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingTop: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
            관리자 프로필
          </h1>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#495057'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #DEE2E6',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#F8F9FA',
                color: '#000000'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#495057'
            }}>
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #DEE2E6',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#000000'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleUpdate}
              disabled={updating}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: updating ? '#6C757D' : '#007BFF',
                border: 'none',
                borderRadius: '4px',
                cursor: updating ? 'not-allowed' : 'pointer'
              }}
            >
              {updating ? '저장 중...' : '프로필 수정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}