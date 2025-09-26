'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Footer from '@/components/Footer'

export default function RegistrationPendingPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: '#FFF3CD',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '40px' }}>⏰</span>
          </div>
          
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#212529'
          }}>
            회원가입 승인 대기 중
          </h1>
          
          <p style={{ 
            color: '#6C757D', 
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '8px'
          }}>
            회원가입 신청이 접수되었습니다.
          </p>
          
          <p style={{ 
            color: '#6C757D', 
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            담당자가 사업자 정보를 확인 중이며,<br />
            승인 완료 시 이메일로 안내드리겠습니다.
          </p>
        </div>

        <div style={{
          backgroundColor: '#F8F9FA',
          borderRadius: '4px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            color: '#495057', 
            fontSize: '14px',
            margin: 0
          }}>
            <strong>예상 처리 시간:</strong> 영업일 기준 1-2일
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#6C757D',
            backgroundColor: 'white',
            border: '1px solid #DEE2E6',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F8F9FA'
            e.currentTarget.style.borderColor = '#ADB5BD'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.borderColor = '#DEE2E6'
          }}
        >
          로그아웃
        </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}