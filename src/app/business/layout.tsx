'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, status, contract_signed')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      router.push('/business/registration')
      return
    }

    if (business.status === 'pending') {
      router.push('/registration-pending')
      return
    } else if (business.status === 'rejected') {
      await supabase.auth.signOut()
      router.push('/login')
      return
    } else if (business.status !== 'approved') {
      router.push('/business/registration-complete')
      return
    }

    setBusinessId(business.id)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>로딩 중...</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Navigation */}
      <nav style={{ 
        backgroundColor: '#1B4D3E', 
        padding: '0 40px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ 
            color: '#FFB800', 
            fontSize: '28px', 
            fontWeight: 'bold',
            margin: 0 
          }}>MONA</h1>
          <div style={{ display: 'flex', gap: '30px' }}>
            <Link href="/business/dashboard" style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontSize: '16px'
            }}>대시보드</Link>
            <Link href="/business/donations" style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontSize: '16px'
            }}>내 기부 목록</Link>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#1B4D3E"/>
          </svg>
        </button>
      </nav>
      <main>
        {children}
      </main>
    </div>
  )
}