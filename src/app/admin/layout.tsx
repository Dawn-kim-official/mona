'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/business/dashboard')
      return
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>로딩 중...</div>
  }

  const navItems = [
    { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
    { href: '/admin/businesses', label: '사업자 관리', icon: '🏢' },
    { href: '/admin/donations', label: '기부 관리', icon: '📦' },
    { href: '/admin/quotes', label: '견적 관리', icon: '📄' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Top Navigation Bar */}
      <nav style={{ 
        backgroundColor: '#1B4D3E',
        padding: '0 40px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '14px' }}>관리자</span>
            <h1 style={{ 
              color: '#FFB800', 
              fontSize: '28px', 
              fontWeight: 'bold',
              margin: 0
            }}>MONA</h1>
          </div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <Link href="/admin/businesses" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
              회원 관리
            </Link>
            <Link href="/admin/donations" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
              기부 관리
            </Link>
            <Link href="/admin/reports" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
              리포트 관리
            </Link>
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
      
      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}