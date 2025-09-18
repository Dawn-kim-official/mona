'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

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
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Navigation */}
      <nav style={{ 
        backgroundColor: '#02391f', 
        padding: '0 40px',
        height: '70px',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ 
            color: '#ffd020', 
            fontSize: '28px', 
            fontWeight: 'bold',
            margin: 0 
          }}>MONA</h1>
          <div style={{ display: 'flex', gap: '30px' }}>
            <Link href="/business/dashboard" style={{ 
              color: pathname === '/business/dashboard' ? '#ffd020' : 'white', 
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: pathname === '/business/dashboard' ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname === '/business/dashboard' ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>대시보드</Link>
            <Link href="/business/donations" style={{ 
              color: pathname === '/business/donations' ? '#ffd020' : 'white', 
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: pathname === '/business/donations' ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname === '/business/donations' ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>내 기부 목록</Link>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
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
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#02391f"/>
            </svg>
          </button>
          
          {showUserMenu && (
            <>
              {/* 오버레이 */}
              <div 
                onClick={() => setShowUserMenu(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              
              {/* 메뉴 드롭다운 */}
              <div style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <Link 
                  href="/business/profile"
                  style={{
                    display: 'block',
                    padding: '12px 20px',
                    fontSize: '14px',
                    color: '#212529',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  회원정보 관리
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    fontSize: '14px',
                    color: '#DC3545',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    border: 'none',
                    borderTop: '1px solid #DEE2E6',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
      <main style={{ 
        flex: '1 1 auto',
        overflowY: 'scroll',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        {children}
      </main>
    </div>
  )
}