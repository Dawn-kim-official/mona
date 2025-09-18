'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Business = Database['public']['Tables']['businesses']['Row']

export default function AdminReportsPage() {
  const supabase = createClient()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [mediaLinks, setMediaLinks] = useState<string[]>([''])
  const [reportType, setReportType] = useState('ESG')

  useEffect(() => {
    fetchBusinesses()
  }, [])

  async function fetchBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'approved')
      .order('name', { ascending: true })

    if (!error && data) {
      setBusinesses(data)
    }
    setLoading(false)
  }

  async function fetchReports(businessId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReports(data)
    } else {
      // If reports table doesn't exist, try to get from businesses table
      const { data: businessData } = await supabase
        .from('businesses')
        .select('esg_report_url')
        .eq('id', businessId)
        .single()

      if (businessData?.esg_report_url) {
        setReports([{
          id: businessId,
          business_id: businessId,
          report_url: businessData.esg_report_url,
          media_links: [],
          report_type: 'ESG',
          report_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
      } else {
        setReports([])
      }
    }
  }

  async function handleReportUpload(businessId: string, file: File) {
    setUploadingId(businessId)
    
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `esg-reports/${businessId}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('esg-reports')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('esg-reports')
        .getPublicUrl(fileName)
      
      // Save report with media links
      const validMediaLinks = mediaLinks.filter(link => link.trim() !== '')
      
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          business_id: businessId,
          report_url: publicUrl,
          media_links: validMediaLinks,
          report_type: reportType,
          report_date: new Date().toISOString()
        })
      
      if (insertError) {
        // If reports table doesn't exist, fallback to old method
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ esg_report_url: publicUrl })
          .eq('id', businessId)
        
        if (updateError) throw updateError
      }
      
      // Refresh data
      await fetchBusinesses()
      if (selectedBusiness) {
        await fetchReports(selectedBusiness.id)
      }
      setMediaLinks([''])
      alert('리포트가 성공적으로 업로드되었습니다.')
    } catch (error) {
      // Error uploading report
      alert('리포트 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingId(null)
    }
  }

  function addMediaLink() {
    setMediaLinks([...mediaLinks, ''])
  }

  function updateMediaLink(index: number, value: string) {
    const updated = [...mediaLinks]
    updated[index] = value
    setMediaLinks(updated)
  }

  function removeMediaLink(index: number) {
    setMediaLinks(mediaLinks.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#212529' }}>
          ESG 리포트 관리
        </h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px' }}>사업자명</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>대표자명</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>연락처</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>리포트 상태</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>누적 리포트</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                    {business.name}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#212529' }}>
                    {business.representative_name}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6C757D' }}>
                    {business.phone}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                    {(business as any).esg_report_url ? (
                      <a 
                        href={(business as any).esg_report_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#28A745', 
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        최신 리포트
                      </a>
                    ) : (
                      <span style={{ color: '#6C757D' }}>미업로드</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        setSelectedBusiness(business)
                        await fetchReports(business.id)
                        setShowReportModal(true)
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '400',
                        color: '#007BFF',
                        backgroundColor: 'transparent',
                        border: '1px solid #007BFF',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      히스토리 보기
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedBusiness(business)
                        setShowReportModal(true)
                      }}
                      disabled={uploadingId === business.id}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: uploadingId === business.id ? '#6C757D' : '#007BFF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploadingId === business.id ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {uploadingId === business.id ? '업로드 중...' : '새 리포트'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 리포트 히스토리 모달 */}
      {showReportModal && selectedBusiness && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#212529' }}>
                {selectedBusiness.name} - 리포트 히스토리
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setSelectedBusiness(null)
                  setReports([])
                  setMediaLinks([''])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6C757D'
                }}
              >
                ×
              </button>
            </div>

            {/* 새 리포트 업로드 섹션 */}
            <div style={{
              backgroundColor: '#F8F9FA',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057' }}>새 리포트 추가</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  리포트 유형
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #DEE2E6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="ESG">ESG 리포트</option>
                  <option value="기부">기부 리포트</option>
                  <option value="활동">활동 리포트</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  미디어 링크 (사진/영상 URL)
                </label>
                {mediaLinks.map((link, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateMediaLink(index, e.target.value)}
                      placeholder="https://example.com/media.jpg"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #DEE2E6',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    {mediaLinks.length > 1 && (
                      <button
                        onClick={() => removeMediaLink(index)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#DC3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMediaLink}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28A745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  + 미디어 링크 추가
                </button>
              </div>

              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && selectedBusiness) {
                      handleReportUpload(selectedBusiness.id, file)
                    }
                  }}
                  style={{ display: 'none' }}
                  id="report-upload"
                />
                <label
                  htmlFor="report-upload"
                  style={{
                    display: 'inline-block',
                    padding: '8px 24px',
                    backgroundColor: '#007BFF',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  리포트 파일 선택 및 업로드
                </label>
              </div>
            </div>

            {/* 리포트 히스토리 목록 */}
            <div>
              <h4 style={{ marginBottom: '16px', fontSize: '16px', color: '#495057' }}>업로드된 리포트</h4>
              {reports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.map((report, idx) => (
                    <div key={report.id || idx} style={{
                      padding: '12px',
                      border: '1px solid #DEE2E6',
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500', color: '#212529' }}>
                          {report.report_type} 리포트
                        </span>
                        <span style={{ color: '#6C757D', fontSize: '13px' }}>
                          {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a
                          href={report.report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#007BFF',
                            fontSize: '13px',
                            textDecoration: 'none'
                          }}
                        >
                          📄 리포트 보기
                        </a>
                        {report.media_links && report.media_links.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {report.media_links.map((link: string, linkIdx: number) => (
                              <a
                                key={linkIdx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#17A2B8',
                                  fontSize: '13px',
                                  textDecoration: 'none'
                                }}
                              >
                                📷 미디어 {linkIdx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6C757D', textAlign: 'center' }}>아직 업로드된 리포트가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}