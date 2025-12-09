import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      to,
      type,
      organizationName,
      rejectionReason,
      // 추가 데이터 필드들
      donationName,
      businessName,
      beneficiaryName,
      quoteAmount,
      pickupDate,
      pickupTime,
      pickupStaff,
      pickupStaffPhone,
      reportUrl,
      proposalLink,
      receiptLink,
      memberType,
      signupDate,
      quantity,
      unit,
      pickupLocation,
      acceptedQuantity
    } = body

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
    // ==================== 기부기업 이메일 (5개) ====================
    else if (type === 'business_donation_registered') {
      subject = `[MONA] 기부 등록이 완료되었습니다`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p>등록하신 기부 <strong>${donationName}</strong> 이 정상적으로 접수되었습니다.</p>
        <p>관리자 검토 후 기관 매칭이 진행될 예정입니다.</p>
        <p>기부 절차 관련 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락해 주세요.</p>
      `
    } else if (type === 'business_quote_ready') {
      subject = `[MONA] 세금계산서 승인 요청`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p><strong>${donationName}</strong> 에 대한 세금계산서가 발행되었습니다.</p>
        <p><a href="https://platform.monaofficial.co/">플랫폼</a>에 접속해 승인해 주세요.</p>
        <br>
        <p>관련 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락해 주세요.</p>
      `
    } else if (type === 'business_matching_complete') {
      subject = `[MONA] 기부 매칭이 완료되었습니다. 배송 정보를 확인해 주세요`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p><strong>${donationName}</strong> 에 대한 기부 매칭이 성공적으로 완료되었습니다.</p>
        <br>
        <p>아래의 물품의 픽업 또는 배송 주소지를 확인해주세요.</p>
        <br>
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p><strong>유형:</strong> 픽업</p>
        <p><strong>장소:</strong> ${pickupLocation || '플랫폼에서 확인해주세요'}</p>
        <br>
        <p>배송정보 수정이 필요하신 경우 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락 주시기 바랍니다.</p>
      `
    } else if (type === 'business_pickup_confirmed') {
      subject = `[MONA] 픽업/배송 일정이 확정되었습니다`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p><strong>${donationName}</strong> 의 픽업/배송 일정이 확정되었습니다.</p>
        <p>세부 일정은 <a href="https://platform.monaofficial.co/">플랫폼</a>에서 확인 가능합니다.</p>
        <br>
        <p>일정 관련 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락 바랍니다.</p>
      `
    } else if (type === 'business_report_uploaded') {
      subject = `[MONA] 기부 결과 자료가 업로드되었습니다.`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p>귀사의 기부 활동에 대한 세금영수증 사진 후기 ESG 보고서가 모두 업로드되었습니다.</p>
        <p>자료는 <a href="https://platform.monaofficial.co/">플랫폼</a>에서 확인하실 수 있습니다.</p>
        <br>
        <p>이번 기부를 통해 귀사가 만들어낸 임팩트에 감사드리며</p>
        <p>자료 수정이나 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 알려주세요.</p>
      `
    }
    // ==================== 수혜기관 이메일 (3개) ====================
    else if (type === 'beneficiary_match_proposal') {
      subject = `[MONA] 기업에서 귀 기관에 기부 매칭을 제안했습니다`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p>기업에서 귀 기관에 기부 매칭을 제안했습니다.</p>
        <br>
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p>세부 내용은 <a href="https://platform.monaofficial.co/">플랫폼</a>에서 확인하신 뒤 수락 여부를 선택해 주세요.</p>
        <br>
        <p>매칭 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락해 주세요.</p>
      `
    } else if (type === 'beneficiary_pickup_confirmed') {
      subject = `[MONA] 배송/픽업 일정이 확정되었습니다`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p>기부 물품의 수령 일정이 아래와 같이 확정되었습니다.</p>
        <br>
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p><strong>수량:</strong> ${acceptedQuantity || ''}${unit || ''}</p>
        <p><strong>유형:</strong> 픽업</p>
        <p><strong>일정:</strong> ${pickupDate} ${pickupTime}</p>
        <p><strong>장소:</strong> ${pickupLocation || '플랫폼에서 확인해주세요'}</p>
        <br>
        <p>직접 픽업하시는 경우 원활한 진행을 위해 약속된 시간을 꼭 지켜주시기 바랍니다.</p>
        <br>
        <p>확정된 일정과 진행상황은 <a href="https://platform.monaofficial.co/">플랫폼</a>에서 확인하실 수 있습니다.</p>
        <br>
        <p>일정 관련 문의는 <a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a> 로 연락주시면 안내드리겠습니다.</p>
      `
    } else if (type === 'beneficiary_receipt_request') {
      subject = `[MONA] 수령이 완료되었습니다. 수령 확인을 진행해 주세요`
      html = `
        <p>안녕하세요. MONA입니다.</p>
        <p><strong>${donationName}</strong>의 수령이 완료되었습니다.</p>
        <p><a href="https://platform.monaofficial.co/">플랫폼</a>에서 수령 완료 버튼을 클릭하시고, 해당 시 세금영수증을 업로드해 주세요.</p>
        <br>
        <p>또한 원활한 기록과 투명한 임팩트 공유를 위해</p>
        <p>1주일 이내에 아래 자료를 메일(<a href="mailto:partnership@monaofficial.co">partnership@monaofficial.co</a>)로 회신해 주시면 감사하겠습니다.</p>
        <br>
        <ul>
          <li>수령 사진</li>
          <li>수혜자 사진</li>
          <li>수혜자 수</li>
          <li>수혜자 후기</li>
          <li>기관 후기</li>
        </ul>
        <br>
        <p>이번 매칭과 픽업 과정에서 개선이 필요하다고 느끼신 부분이 있다면</p>
        <p>자유롭게 의견을 보내주세요. 적극 반영하겠습니다.</p>
        <br>
        <p>이번 매칭이 귀 기관의 소중한 활동에 도움이 되었기를 바랍니다.</p>
      `
    }
    // ==================== 어드민 이메일 (4개) ====================
    else if (type === 'admin_signup_request') {
      subject = `[플랫폼] 신규 회원가입 승인 요청`
      html = `
        <p><strong>${organizationName}</strong></p>
        <p><a href="https://platform.monaofficial.co/">플랫폼</a>에서 확인 후 승인/거절 진행해주세요.</p>
      `
    } else if (type === 'admin_donation_created') {
      subject = `[플랫폼] 새로운 기부가 등록되었습니다`
      html = `
        <p>새로운 기부가 등록되었습니다.</p>
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p><strong>회사명:</strong> ${businessName}</p>
        <p>기부 내용을 검토한 뒤 매칭을 진행해 주세요.</p>
      `
    } else if (type === 'admin_quote_accepted') {
      subject = `[플랫폼] 기업이 세금계산서를 승인했습니다`
      html = `
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p><strong>회사명:</strong> ${businessName}</p>
        <p>해당 기부 건의 세금계산서를 승인했습니다.</p>
      `
    } else if (type === 'admin_receipt_submitted') {
      subject = `[플랫폼] 기관 수령 요청이 접수되었습니다`
      html = `
        <p><strong>기부건명:</strong> ${donationName}</p>
        <p><strong>기관명:</strong> ${beneficiaryName}</p>
        <p>해당 기부 건에 대해 기관에서 수령 요청이 도착했습니다. 기관 정보를 확인하신 뒤 적절한 매칭을 진행해 주세요.</p>
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