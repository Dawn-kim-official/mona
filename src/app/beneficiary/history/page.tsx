'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface DonationHistory {
  id: string
  donation_id: string
  status: string
  proposed_at: string
  responded_at: string | null
  received_at: string | null
  receipt_photos: string[] | null
  receipt_issued: boolean
  receipt_file_url: string | null
  donations: {
    id: string
    name: string
    description: string
    quantity: number
    unit: string
    pickup_deadline: string
    photos?: string[]
    businesses: {
      name: string
    }
  }
}

export default function BeneficiaryHistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [history, setHistory] = useState<DonationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get beneficiary info
    const { data: beneficiary } = await supabase
      .from('beneficiaries')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!beneficiary) {
      setLoading(false)
      return
    }


    // 먼저 모든 donation_matches 확인
    const { data: allMatches } = await supabase
      .from('donation_matches')
      .select('*')
      .eq('beneficiary_id', beneficiary.id)
    

    // Fetch accepted/received donations - 수령 완료된 것만 표시
    const { data, error } = await supabase
      .from('donation_matches')
      .select(`
        *,
        donations (
          id,
          name,
          description,
          quantity,
          unit,
          pickup_deadline,
          photos,
          businesses (
            name
          )
        )
      `)
      .eq('beneficiary_id', beneficiary.id)
      .eq('status', 'received')  // 수령 완료된 것만

    if (error) {
      // Error fetching history
    } else {
      setHistory(data || [])
    }

    setLoading(false)
  }

  async function handleReceiptUpload(matchId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(matchId)

    try {
      // Upload file to Supabase Storage
      const fileName = `receipts/${matchId}_${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('donation-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('donation-images')
        .getPublicUrl(fileName)

      // Update donation match with receipt photo
      const match = history.find(h => h.id === matchId)
      const existingPhotos = match?.receipt_photos || []
      
      const { error: updateError } = await supabase
        .from('donation_matches')
        .update({
          receipt_photos: [...existingPhotos, publicUrl],
          received_at: match?.received_at || new Date().toISOString(),
          status: 'received'
        })
        .eq('id', matchId)

      if (updateError) throw updateError

      alert('수령 확인 사진이 업로드되었습니다.')
      await fetchHistory()
    } catch (error) {
      alert('사진 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .main-container {
            padding: 16px !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-table {
            display: block !important;
          }
          .mobile-cards {
            display: none !important;
          }
        }
      `}} />
      
      <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }} className="main-container">
        <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
          기부 수령 내역
        </h1>

        {history.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '80px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ color: '#6C757D', fontSize: '16px' }}>
              수령한 기부가 없습니다.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Layout */}
            <div style={{
              display: 'grid',
              gap: '16px'
            }} className="desktop-layout">
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }} className="history-header">
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#212529',
                      marginBottom: '12px'
                    }}>
                      {item.donations?.name || item.donations?.description || '기부 물품'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }} className="history-card-grid">
                      <div>
                        <label style={{ fontSize: '13px', color: '#6C757D' }}>기업명</label>
                        <p style={{ fontSize: '14px', color: '#212529', margin: '4px 0' }}>
                          {item.donations?.businesses?.name}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', color: '#6C757D' }}>수량</label>
                        <p style={{ fontSize: '14px', color: '#212529', margin: '4px 0' }}>
                          {item.donations?.quantity}{item.donations?.unit || 'kg'}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', color: '#6C757D' }}>수락일</label>
                        <p style={{ fontSize: '14px', color: '#212529', margin: '4px 0' }}>
                          {item.responded_at ? new Date(item.responded_at).toLocaleDateString('ko-KR') : '-'}
                        </p>
                      </div>
                      {item.received_at && (
                        <div>
                          <label style={{ fontSize: '13px', color: '#6C757D' }}>수령일</label>
                          <p style={{ fontSize: '14px', color: '#212529', margin: '4px 0' }}>
                            {new Date(item.received_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 수령 확인 사진 표시 */}
                    {item.receipt_photos && item.receipt_photos.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '13px', color: '#6C757D', display: 'block', marginBottom: '8px' }}>
                          수령 확인 사진
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="receipt-photos">
                          {item.receipt_photos.map((photo, index) => (
                            <a
                              key={index}
                              href={photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: '1px solid #DEE2E6'
                              }}
                              className="receipt-photo"
                            >
                              <img
                                src={photo}
                                alt={`수령 확인 ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '24px' }} className="history-actions">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          color: '#007BFF',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: '#007BFF20',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          수령 완료
                        </span>
                        {item.receipt_issued && (
                          <span style={{ 
                            color: '#28A745',
                            fontWeight: '500',
                            fontSize: '12px',
                            backgroundColor: '#28A74520',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            영수증 발급됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 수령 확인 업로드 */}
                <div style={{ 
                  marginTop: '16px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid #E9ECEF' 
                }}>
                  <input
                    type="file"
                    id={`receipt-${item.id}`}
                    accept="image/*"
                    onChange={(e) => handleReceiptUpload(item.id, e)}
                    style={{ display: 'none' }}
                    disabled={uploading === item.id}
                  />
                  <label
                    htmlFor={`receipt-${item.id}`}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#007BFF',
                      backgroundColor: 'transparent',
                      border: '1px solid #007BFF',
                      borderRadius: '4px',
                      cursor: uploading === item.id ? 'not-allowed' : 'pointer',
                      opacity: uploading === item.id ? 0.6 : 1,
                      transition: 'all 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      if (uploading !== item.id) {
                        e.currentTarget.style.backgroundColor = '#007BFF';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#007BFF';
                    }}
                  >
                    {uploading === item.id ? '업로드 중...' : '수령 확인 사진 추가'}
                  </label>
                </div>
                </div>
              ))}
            </div>
            
            {/* Mobile Layout */}
            <div className="mobile-layout">
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #E9ECEF'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529', marginBottom: '4px' }}>
                      {item.donations?.name || item.donations?.description || '기부 물품'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px' }}>
                      기업: {item.donations?.businesses?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        color: '#007BFF',
                        fontWeight: '500',
                        fontSize: '12px',
                        backgroundColor: '#007BFF20',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        수령 완료
                      </span>
                      {item.receipt_issued && (
                        <span style={{ 
                          color: '#28A745',
                          fontWeight: '500',
                          fontSize: '12px',
                          backgroundColor: '#28A74520',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          영수증 발급됨
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#6C757D', fontSize: '12px' }}>수량</span>
                      <div style={{ fontWeight: '500', color: '#212529' }}>
                        {item.donations?.quantity}{item.donations?.unit || 'kg'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6C757D', fontSize: '12px' }}>수락일</span>
                      <div style={{ fontWeight: '500', color: '#212529' }}>
                        {item.responded_at ? new Date(item.responded_at).toLocaleDateString('ko-KR') : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {item.received_at && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#6C757D', fontSize: '12px' }}>수령일</span>
                      <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                        {new Date(item.received_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  )}

                  {/* 수령 확인 사진 표시 */}
                  {item.receipt_photos && item.receipt_photos.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#6C757D', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        수령 확인 사진
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {item.receipt_photos.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid #DEE2E6',
                              display: 'block'
                            }}
                          >
                            <img
                              src={photo}
                              alt={`수령 확인 ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 수령 확인 업로드 */}
                  <div style={{ 
                    paddingTop: '12px', 
                    borderTop: '1px solid #E9ECEF' 
                  }}>
                    <input
                      type="file"
                      id={`receipt-mobile-${item.id}`}
                      accept="image/*"
                      onChange={(e) => handleReceiptUpload(item.id, e)}
                      style={{ display: 'none' }}
                      disabled={uploading === item.id}
                    />
                    <label
                      htmlFor={`receipt-mobile-${item.id}`}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#007BFF',
                        backgroundColor: 'transparent',
                        border: '1px solid #007BFF',
                        borderRadius: '4px',
                        cursor: uploading === item.id ? 'not-allowed' : 'pointer',
                        opacity: uploading === item.id ? 0.6 : 1,
                        transition: 'all 0.2s',
                        display: 'inline-block',
                        width: '100%',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    >
                      {uploading === item.id ? '업로드 중...' : '수령 확인 사진 추가'}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </>
  )
}