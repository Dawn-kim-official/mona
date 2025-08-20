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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Sidebar */}
      <nav style={{ 
        width: '280px', 
        backgroundColor: '#1B4D3E',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ 
            color: '#FFB800', 
            fontSize: '32px', 
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '8px'
          }}>MONA</h1>
          <p style={{ color: '#ffffff80', fontSize: '14px', margin: 0 }}>관리자 대시보드</p>
        </div>
        
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link 
              key={item.href}
              href={item.href} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: pathname === item.href ? '#FFB800' : 'white',
                textDecoration: 'none',
                padding: '14px 20px',
                marginBottom: '8px',
                borderRadius: '8px',
                backgroundColor: pathname === item.href ? '#ffffff15' : 'transparent',
                transition: 'all 0.2s',
                fontSize: '15px',
                fontWeight: pathname === item.href ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = '#ffffff10';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: '#ffffff20',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff30';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff20';
          }}
        >
          <span>🚪</span>
          로그아웃
        </button>
      </nav>
      
      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}