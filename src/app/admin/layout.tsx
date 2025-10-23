'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .mobile-menu-dropdown {
            display: block !important;
          }
          .main-container {
            padding: 20px !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-menu-dropdown {
            display: none !important;
          }
        }
      `}} />
      
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Top Navigation Bar */}
      <nav style={{ 
        backgroundColor: '#02391f',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '14px' }}>관리자</span>
            <h1 style={{ 
              color: '#ffd020', 
              fontSize: '28px', 
              fontWeight: 'bold',
              margin: 0
            }}>MONA</h1>
          </div>
          
          {/* Desktop Menu */}
          <div style={{ display: 'flex', gap: '20px' }} className="desktop-menu">
            <Link href="/admin/dashboard" style={{ 
              color: pathname === '/admin/dashboard' ? '#ffd020' : 'white', 
              textDecoration: 'none', 
              fontSize: '16px',
              fontWeight: pathname === '/admin/dashboard' ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname === '/admin/dashboard' ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>
              대시보드
            </Link>
            <Link href="/admin/businesses" style={{ 
              color: pathname === '/admin/businesses' ? '#ffd020' : 'white', 
              textDecoration: 'none', 
              fontSize: '16px',
              fontWeight: pathname === '/admin/businesses' ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname === '/admin/businesses' ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>
              회원 관리
            </Link>
            <Link href="/admin/donations" style={{ 
              color: pathname.startsWith('/admin/donation') ? '#ffd020' : 'white', 
              textDecoration: 'none', 
              fontSize: '16px',
              fontWeight: pathname.startsWith('/admin/donation') ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname.startsWith('/admin/donation') ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>
              기부 관리
            </Link>
            <Link href="/admin/reports" style={{ 
              color: pathname === '/admin/reports' ? '#ffd020' : 'white', 
              textDecoration: 'none', 
              fontSize: '16px',
              fontWeight: pathname === '/admin/reports' ? '600' : '400',
              padding: '8px 16px',
              backgroundColor: pathname === '/admin/reports' ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}>
              리포트 관리
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{ 
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
            className="mobile-menu-button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          
          {/* User Menu Button */}
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
                  href="/admin/profile"
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
        </div>
        
        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <>
            {/* 모바일 메뉴 오버레이 */}
            <div 
              onClick={() => setShowMobileMenu(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
            />
            
            {/* 모바일 메뉴 드롭다운 */}
            <div style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1000,
              display: 'none'
            }} className="mobile-menu-dropdown">
              <Link 
                href="/admin/dashboard"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  fontSize: '16px',
                  color: pathname === '/admin/dashboard' ? '#ffd020' : '#212529',
                  backgroundColor: pathname === '/admin/dashboard' ? '#02391f' : 'white',
                  textDecoration: 'none',
                  borderBottom: '1px solid #E9ECEF',
                  transition: 'background-color 0.2s'
                }}
              >
                대시보드
              </Link>
              <Link 
                href="/admin/businesses"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  fontSize: '16px',
                  color: pathname === '/admin/businesses' ? '#ffd020' : '#212529',
                  backgroundColor: pathname === '/admin/businesses' ? '#02391f' : 'white',
                  textDecoration: 'none',
                  borderBottom: '1px solid #E9ECEF',
                  transition: 'background-color 0.2s'
                }}
              >
                회원 관리
              </Link>
              <Link 
                href="/admin/donations"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  fontSize: '16px',
                  color: pathname.startsWith('/admin/donation') ? '#ffd020' : '#212529',
                  backgroundColor: pathname.startsWith('/admin/donation') ? '#02391f' : 'white',
                  textDecoration: 'none',
                  borderBottom: '1px solid #E9ECEF',
                  transition: 'background-color 0.2s'
                }}
              >
                기부 관리
              </Link>
              <Link 
                href="/admin/reports"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  fontSize: '16px',
                  color: pathname === '/admin/reports' ? '#ffd020' : '#212529',
                  backgroundColor: pathname === '/admin/reports' ? '#02391f' : 'white',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s'
                }}
              >
                리포트 관리
              </Link>
            </div>
          </>
        )}
      </nav>
      
      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
        <Footer />
      </main>
      </div>
    </>
  )
}