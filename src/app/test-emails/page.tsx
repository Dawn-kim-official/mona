'use client'

import { useState } from 'react'

export default function TestEmailsPage() {
  const [isSending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)

  const testData = {
    donationName: '테스트 기부 - 생수 500박스',
    businessName: '테스트 기업 (주)',
    beneficiaryName: '사랑의 복지관',
    organizationName: '테스트 회원',
    quantity: '500',
    unit: '박스',
    pickupDate: '2025-12-15',
    pickupTime: '14:00-16:00',
    pickupLocation: '서울시 강남구 테헤란로 123',
    pickupStaff: '김담당',
    pickupStaffPhone: '010-1234-5678',
    quoteAmount: '1,500,000',
    reportUrl: 'https://platform.monaofficial.co/reports/test',
    proposalLink: 'https://platform.monaofficial.co/proposals/test',
    receiptLink: 'https://platform.monaofficial.co/receipts/test',
    memberType: '기업',
    signupDate: '2025-12-08',
    acceptedQuantity: '300'
  }

  const emailTypes = [
    { type: 'business_donation_registered', name: '기업 - 기부 등록 완료' },
    { type: 'business_quote_ready', name: '기업 - 견적서 발송' },
    { type: 'business_matching_complete', name: '기업 - 매칭 완료' },
    { type: 'business_pickup_confirmed', name: '기업 - 픽업 일정 확정' },
    { type: 'business_report_uploaded', name: '기업 - ESG 리포트 업로드' },
    { type: 'beneficiary_match_proposal', name: '수혜기관 - 매칭 제안' },
    { type: 'beneficiary_pickup_confirmed', name: '수혜기관 - 픽업 일정 확정' },
    { type: 'beneficiary_receipt_request', name: '수혜기관 - 수령 확인 요청' },
    { type: 'admin_signup_request', name: '어드민 - 회원가입 승인 요청' },
    { type: 'admin_donation_created', name: '어드민 - 기부 등록 알림' },
    { type: 'admin_quote_accepted', name: '어드민 - 견적서 승인 알림' },
    { type: 'admin_receipt_submitted', name: '어드민 - 수령 확인 알림' }
  ]

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const sendSingleEmail = async (emailType: string, emailName: string) => {
    setSendingEmail(emailType)

    try {
      addLog(`${emailName} 발송 중...`)

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'esther78944@gmail.com',
          type: emailType,
          ...testData
        })
      })

      if (response.ok) {
        addLog(`✓ ${emailName} 발송 완료`)
      } else {
        const error = await response.text()
        addLog(`✗ ${emailName} 발송 실패: ${error}`)
      }
    } catch (error) {
      addLog(`✗ ${emailName} 발송 오류: ${error}`)
    }

    setSendingEmail(null)
  }

  const sendAllEmails = async () => {
    setSending(true)
    setProgress(0)
    setLogs([])

    addLog('테스트 이메일 발송 시작...')

    for (let i = 0; i < emailTypes.length; i++) {
      const email = emailTypes[i]

      try {
        addLog(`${email.name} 발송 중...`)

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'esther78944@gmail.com',
            type: email.type,
            ...testData
          })
        })

        if (response.ok) {
          addLog(`✓ ${email.name} 발송 완료`)
        } else {
          const error = await response.text()
          addLog(`✗ ${email.name} 발송 실패: ${error}`)
        }
      } catch (error) {
        addLog(`✗ ${email.name} 발송 오류: ${error}`)
      }

      setProgress(i + 1)

      // 다음 이메일 전송 전 1초 대기
      if (i < emailTypes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    addLog('모든 테스트 이메일 발송 완료!')
    setSending(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#02391f', marginBottom: '20px' }}>
        이메일 테스트 페이지
      </h1>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>테스트 정보</h2>
        <p style={{ margin: '5px 0' }}>수신 이메일: <strong>esther78944@gmail.com</strong></p>
        <p style={{ margin: '5px 0' }}>총 이메일 수: <strong>12개</strong></p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          각 이메일 발송 사이 1초 간격이 적용됩니다.
        </p>
      </div>

      <button
        onClick={sendAllEmails}
        disabled={isSending}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#02391f',
          backgroundColor: '#ffd020',
          border: 'none',
          borderRadius: '8px',
          cursor: isSending ? 'not-allowed' : 'pointer',
          opacity: isSending ? 0.6 : 1,
          marginBottom: '30px'
        }}
      >
        {isSending ? `발송 중... (${progress}/12)` : '12개 테스트 이메일 발송'}
      </button>

      {logs.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          color: '#00ff00',
          fontFamily: 'monospace',
          fontSize: '14px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>개별 이메일 테스트</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {emailTypes.map((email, index) => (
            <button
              key={index}
              onClick={() => sendSingleEmail(email.type, email.name)}
              disabled={isSending || sendingEmail !== null}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: sendingEmail === email.type ? '#fff' : '#02391f',
                backgroundColor: sendingEmail === email.type ? '#02391f' : '#fff',
                border: '2px solid #02391f',
                borderRadius: '8px',
                cursor: (isSending || sendingEmail !== null) ? 'not-allowed' : 'pointer',
                opacity: (isSending || (sendingEmail !== null && sendingEmail !== email.type)) ? 0.4 : 1,
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{email.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{email.type}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
