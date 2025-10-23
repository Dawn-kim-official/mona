'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Footer from '@/components/Footer'

export default function BeneficiaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [newProposalsCount, setNewProposalsCount] = useState(0)
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (beneficiaryId) {
      checkNewProposals()
      // Set up realtime subscription for donation status changes
      const channel = supabase
        .channel('donation-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'donations'
          },
          () => {
            checkNewProposals()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [beneficiaryId])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is a beneficiary
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'beneficiary') {
      router.push('/login')
      return
    }

    // Get beneficiary info
    const { data: beneficiary } = await supabase
      .from('beneficiaries')
      .select('id, organization_name, status')
      .eq('user_id', user.id)
      .single()

    if (!beneficiary) {
      router.push('/login')
      return
    }

    if (beneficiary.status === 'pending') {
      router.push('/registration-pending')
      return
    }

    if (beneficiary.status === 'rejected') {
      alert('회원가입이 거절되었습니다. 관리자에게 문의하세요.')
      await supabase.auth.signOut()
      router.push('/login')
      return
    }

    setOrganizationName(beneficiary.organization_name)
    setBeneficiaryId(beneficiary.id)
    setLoading(false)
  }

  async function checkNewProposals() {
    if (!beneficiaryId) return

    // Get beneficiary organization name
    const { data: beneficiaryData } = await supabase
      .from('beneficiaries')
      .select('organization_name')
      .eq('id', beneficiaryId)
      .single()

    if (!beneficiaryData) return

    // Check donations that are matched with this beneficiary and pending response
    const { data } = await supabase
      .from('donations')
      .select('id')
      .eq('matched_charity_name', beneficiaryData.organization_name)
      .eq('status', 'matched')

    setNewProposalsCount(data?.length || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }


  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>
  }

  const navItems = [
    { href: '/beneficiary/dashboard', label: '대시보드' },
    { href: '/beneficiary/proposals', label: '제안받은 기부' },
    { href: '/beneficiary/receipts', label: '기부 수령 내역' },
    { href: '/beneficiary/history', label: '전체 내역' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Top Navigation Bar - 반응형 */}
      <nav style={{ 
        backgroundColor: '#02391f',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* 브랜드 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'white', fontSize: '14px' }}>수혜기관</span>
          <h1 style={{ 
            color: '#ffd020', 
            fontSize: '28px', 
            fontWeight: 'bold',
            margin: 0
          }}>MONA</h1>
        </div>

        {/* 데스크톱 네비게이션 */}
        <div style={{ 
          display: 'none', 
          alignItems: 'center',
          gap: '30px'
        }} className="desktop-nav">
          {navItems.map(item => (
            <Link 
              key={item.href}
              href={item.href} 
              style={{ 
                color: pathname === item.href ? '#ffd020' : 'white', 
                textDecoration: 'none', 
                fontSize: '16px',
                fontWeight: pathname === item.href ? '600' : '400',
                padding: '8px 16px',
                backgroundColor: pathname === item.href ? 'rgba(255, 208, 32, 0.1)' : 'transparent',
                borderRadius: '6px',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
              {item.href === '/beneficiary/proposals' && newProposalsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-20px',
                  backgroundColor: '#FF4444',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {newProposalsCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* 오른쪽 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 기관명 (모바일에서 숨김) */}
          <span style={{ 
            color: 'white', 
            fontSize: '14px',
            display: 'none'
          }} className="desktop-only">
            {organizationName}
          </span>
          
          {/* 모바일 메뉴 버튼 */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {/* 사용자 프로필 버튼 (데스크톱에서만) */}
          <div style={{ position: 'relative', display: 'none' }} className="desktop-only">
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
                    href="/beneficiary/profile"
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
      </nav>

      {/* 모바일 메뉴 */}
      {showMobileMenu && (
        <>
          {/* 오버레이 */}
          <div 
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998
            }}
          />
          
          {/* 모바일 메뉴 패널 */}
          <div style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            backgroundColor: '#02391f',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 999,
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {/* 기관명 */}
            <div style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {organizationName}
            </div>
            
            {/* 네비게이션 아이템들 */}
            {navItems.map(item => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                style={{ 
                  display: 'block',
                  color: pathname === item.href ? '#ffd020' : 'white', 
                  textDecoration: 'none', 
                  fontSize: '16px',
                  fontWeight: pathname === item.href ? '600' : '400',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}
              >
                {item.label}
                {item.href === '/beneficiary/proposals' && newProposalsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#FF4444',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {newProposalsCount}
                  </span>
                )}
              </Link>
            ))}
            
            {/* 프로필 메뉴 */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Link 
                href="/beneficiary/profile"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '16px',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                회원정보 관리
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setShowMobileMenu(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  color: '#FF6B6B',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  padding: '12px 0',
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-only {
            display: block !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>

      {/* Main Content */}
      <main style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  )
}