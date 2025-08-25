'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegistrationCompletePage() {
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#D4EDDA',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px'
        }}>
          ✓
        </div>
        
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: '#212529'
        }}>
          회원가입이 완료되었습니다!
        </h1>
        
        <p style={{ 
          color: '#6C757D', 
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          사업자 정보를 검토 중입니다.<br />
          승인이 완료되면 이메일로 안내드리겠습니다.<br />
          <span style={{ fontSize: '14px' }}>
            (보통 1-2 영업일 내 처리됩니다)
          </span>
        </p>

        <div style={{
          backgroundColor: '#F8F9FA',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            marginBottom: '12px',
            color: '#212529'
          }}>
            다음 단계
          </h3>
          <ol style={{ 
            textAlign: 'left', 
            margin: '0',
            paddingLeft: '20px',
            color: '#495057',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            <li>관리자가 제출하신 사업자 정보를 검토합니다</li>
            <li>승인이 완료되면 이메일로 알림을 보내드립니다</li>
            <li>승인 후 로그인하여 서비스를 이용하실 수 있습니다</li>
          </ol>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#6C757D',
            backgroundColor: 'white',
            border: '1px solid #6C757D',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6C757D'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.color = '#6C757D'
          }}
        >
          로그인 페이지로 돌아가기
        </button>

        <p style={{ 
          marginTop: '24px',
          fontSize: '14px',
          color: '#6C757D'
        }}>
          문의사항이 있으시면 <a 
            href="mailto:support@mona.com" 
            style={{ 
              color: '#007BFF', 
              textDecoration: 'none' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >support@mona.com</a>으로 연락해주세요.
        </p>
      </div>
    </div>
  )
}