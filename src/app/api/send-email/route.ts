import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { to, type, organizationName, rejectionReason } = await request.json()
    
    console.log('Email request:', { to, type, organizationName })

    let subject = ''
    let html = ''

    if (type === 'approved') {
      subject = `[MONA] ${organizationName}님의 가입이 승인되었습니다! 🎉`
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { background: linear-gradient(135deg, #02391f 0%, #0a5f3a 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 40px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; padding: 14px 32px; background: #02391f; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; }
            h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .emoji { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎉</div>
              <h1>가입이 승인되었습니다!</h1>
            </div>
            <div class="content">
              <p>안녕하세요, <strong>${organizationName}</strong>님!</p>
              
              <p>MONA 플랫폼 가입 신청이 <strong style="color: #02391f;">승인</strong>되었습니다.</p>
              
              <p>이제 MONA 플랫폼의 모든 기능을 이용하실 수 있습니다:</p>
              <ul>
                <li>✅ 기부 물품 등록 및 관리</li>
                <li>✅ 수혜기관과의 매칭</li>
                <li>✅ 기부 영수증 발급</li>
                <li>✅ ESG 리포트 관리</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="https://mona-rose-two.vercel.app/login" class="button">로그인하기</a>
              </p>
              
              <p>MONA와 함께 더 나은 세상을 만들어가요! 🌱</p>
              
              <div class="footer">
                <p><strong>문의사항이 있으신가요?</strong><br>
                support@mona.com으로 연락 주시면 친절히 도와드리겠습니다.</p>
                <p style="font-size: 12px; color: #999;">
                  이 메일은 MONA 플랫폼에서 자동으로 발송된 메일입니다.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (type === 'rejected') {
      subject = `[MONA] ${organizationName}님의 가입 신청 결과 안내`
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { background: #f8f9fa; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 40px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; }
            .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; }
            h1 { margin: 0; font-size: 24px; font-weight: 600; color: #495057; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>가입 신청 검토 결과 안내</h1>
            </div>
            <div class="content">
              <p>안녕하세요, <strong>${organizationName}</strong>님.</p>
              
              <p>MONA 플랫폼 가입 신청을 검토한 결과, 아쉽게도 승인이 <strong>보류</strong>되었음을 알려드립니다.</p>
              
              <div class="reason-box">
                <p style="margin: 0; font-weight: 600;">📋 보류 사유</p>
                <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
              </div>
              
              <p>위 사항을 보완하신 후 다시 신청해 주시면 재검토하겠습니다.</p>
              
              <p>추가 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
              
              <div class="footer">
                <p><strong>문의처</strong><br>
                이메일: support@mona.com<br>
                전화: 02-xxxx-xxxx</p>
                <p style="font-size: 12px; color: #999;">
                  이 메일은 MONA 플랫폼에서 자동으로 발송된 메일입니다.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Resend API를 직접 호출
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MONA Platform <noreply@mona.ai.kr>',
        to: [to],
        subject: subject,
        html: html
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: errorText,
        status: response.status 
      }, { status: 400 })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}