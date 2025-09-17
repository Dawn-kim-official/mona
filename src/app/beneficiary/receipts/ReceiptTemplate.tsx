import React from 'react'

interface ReceiptTemplateProps {
  donation: any
  beneficiary: any
}

export default function ReceiptTemplate({ donation, beneficiary }: ReceiptTemplateProps) {
  const quote = donation.quotes[0]
  const today = new Date().toLocaleDateString('ko-KR')
  const receiptNumber = donation.id.slice(0, 8).toUpperCase()

  return (
    <div
      id="receipt-template"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
        color: '#000',
        position: 'absolute',
        left: '-9999px',
        top: 0
      }}
    >
      <div style={{ border: '2px solid #02391f', padding: '30px' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#02391f' }}>
            기부금 영수증
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            (소득세법 제34조, 법인세법 제24조 규정에 의한 기부금 영수증)
          </p>
        </div>

        {/* 영수증 정보 */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>발행번호: {receiptNumber}</span>
            <span>발행일자: {today}</span>
          </div>
        </div>

        {/* 기부자 정보 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#02391f' }}>
            ① 기부자
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5', width: '25%' }}>
                  <strong>법인명(상호)</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '75%' }}>
                  {donation.donations.businesses.name}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>사업자등록번호</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {'123-45-67890'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>대표자</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {donation.donations.businesses.representative_name}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>주소</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {donation.donations.businesses.address}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 수혜기관 정보 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#02391f' }}>
            ② 수혜기관
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5', width: '25%' }}>
                  <strong>단체명</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '75%' }}>
                  {beneficiary.organization_name}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>고유번호</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {beneficiary.registration_number || '987-65-43210'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>대표자</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {beneficiary.representative_name}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5' }}>
                  <strong>주소</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                  {beneficiary.address}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 기부 내역 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#02391f' }}>
            ③ 기부 내용
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#02391f', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>품목</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>수량</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>단가</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>총액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                  {donation.donations.name || donation.donations.description}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                  {donation.donations.quantity}{donation.donations.unit}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                  {quote.unit_price.toLocaleString()}원
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                  {quote.total_amount.toLocaleString()}원
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', backgroundColor: '#f5f5f5' }}>
                  <strong>총 기부금액</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', backgroundColor: '#f5f5f5' }}>
                  <strong>{quote.total_amount.toLocaleString()}원</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 하단 서명 */}
        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', marginBottom: '40px' }}>
            위와 같이 기부금을 수령하였음을 확인합니다.
          </p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {today}
          </p>
          <div style={{ marginTop: '40px' }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#02391f' }}>
              {beneficiary.organization_name}
            </p>
            <p style={{ fontSize: '16px', marginTop: '10px' }}>
              대표자: {beneficiary.representative_name} (인)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}