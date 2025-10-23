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
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [mediaLinks, setMediaLinks] = useState<string[]>([''])
  const [latestReports, setLatestReports] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // Report type removed - no longer needed

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
      
      // Fetch latest report date for each business
      const reportDates: Record<string, string> = {}
      for (const business of data) {
        try {
          const { data: reportData, error } = await supabase
            .from('reports')
            .select('created_at')
            .eq('business_id', business.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
          if (reportData && !error) {
            reportDates[business.id] = new Date(reportData.created_at).toLocaleDateString('ko-KR')
          }
        } catch (err) {
          // 에러 무시하고 계속 진행
        }
      }
      setLatestReports(reportDates)
    }
    setLoading(false)
  }

  async function fetchReports(businessId: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setReports(data)
      } else {
        // reports 테이블에 데이터가 없으면 빈 배열 설정
        setReports([])
      }
    } catch (err) {
      // 에러 발생시 빈 배열 설정
      setReports([])
    }
  }

  async function deleteReport(reportId: string) {
    if (!confirm('정말로 이 리포트를 삭제하시겠습니까?')) {
      return
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      alert('리포트 삭제 중 오류가 발생했습니다.')
    } else {
      alert('리포트가 삭제되었습니다.')
      // Refresh reports
      if (selectedBusiness) {
        await fetchReports(selectedBusiness.id)
      }
    }
  }

  async function handleReportUpload() {
    if (!selectedFile || !selectedBusiness) {
      alert('파일을 선택해주세요.')
      return
    }
    
    setUploadingId(selectedBusiness.id)
    
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `esg-reports/${selectedBusiness.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('esg-reports')
        .upload(fileName, selectedFile, {
          upsert: true
        })
      
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
          business_id: selectedBusiness.id,
          report_url: publicUrl,
          media_links: validMediaLinks,
          report_date: new Date().toISOString()
        })
      
      if (insertError) {
        // If reports table doesn't exist, fallback to old method
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ esg_report_url: publicUrl })
          .eq('id', selectedBusiness.id)
        
        if (updateError) throw updateError
      }
      
      // Refresh data
      await fetchBusinesses()
      if (selectedBusiness) {
        await fetchReports(selectedBusiness.id)
      }
      
      // Reset form
      setMediaLinks([''])
      setSelectedFile(null)
      setShowReportModal(false)  // Close the modal after successful upload
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
          .modal-content {
            width: 95% !important;
            max-width: 95% !important;
            padding: 16px !important;
          }
          .button-group {
            flex-direction: column !important;
            width: 100% !important;
          }
          .button-group button {
            width: 100% !important;
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
          ESG 리포트 관리
        </h1>

        {/* Desktop Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }} className="desktop-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #DEE2E6' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '13px', width: '30%' }}>사업자명</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '25%' }}>리포트 상태 (마지막 업로드 일)</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '20%' }}>히스토리</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px', width: '25%' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#212529' }}>
                    {business.name}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{ color: latestReports[business.id] ? '#212529' : '#6C757D' }}>
                      {latestReports[business.id] || '미업로드'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        setSelectedBusiness(business)
                        await fetchReports(business.id)
                        setShowHistoryModal(true)
                      }}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#007BFF',
                        backgroundColor: 'white',
                        border: '1px solid #007BFF',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#007BFF'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#007BFF'
                      }}
                    >
                      보기
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        setSelectedBusiness(business)
                        await fetchReports(business.id)
                        setShowReportModal(true)
                      }}
                      disabled={uploadingId === business.id}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: uploadingId === business.id ? '#6C757D' : '#28A745',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploadingId === business.id ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (uploadingId !== business.id) {
                          e.currentTarget.style.backgroundColor = '#218838'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (uploadingId !== business.id) {
                          e.currentTarget.style.backgroundColor = '#28A745'
                        }
                      }}
                    >
                      {uploadingId === business.id ? '업로드 중...' : '추가/삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards" style={{ display: 'none' }}>
          {businesses.map((business) => (
            <div key={business.id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#212529'
              }}>
                {business.name}
              </h3>
              
              <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#6C757D' }}>리포트 상태: </span>
                <span style={{ 
                  color: latestReports[business.id] ? '#212529' : '#6C757D',
                  fontWeight: '500'
                }}>
                  {latestReports[business.id] || '미업로드'}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                marginTop: '12px'
              }}>
                <button
                  onClick={async () => {
                    setSelectedBusiness(business)
                    await fetchReports(business.id)
                    setShowHistoryModal(true)
                  }}
                  style={{
                    flex: '1',
                    minWidth: '120px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#007BFF',
                    backgroundColor: 'white',
                    border: '1px solid #007BFF',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  히스토리 보기
                </button>
                <button
                  onClick={async () => {
                    setSelectedBusiness(business)
                    await fetchReports(business.id)
                    setShowReportModal(true)
                  }}
                  disabled={uploadingId === business.id}
                  style={{
                    flex: '1',
                    minWidth: '120px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: uploadingId === business.id ? '#6C757D' : '#28A745',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: uploadingId === business.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploadingId === business.id ? '업로드 중...' : '추가/삭제'}
                </button>
              </div>
            </div>
          ))}
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
          }} className="modal-content">
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
                  setSelectedFile(null)
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  리포트 파일 선택
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
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
                    backgroundColor: '#6C757D',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  파일 선택
                </label>
                
                {selectedFile && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        📄 {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6C757D' }}>
                        크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#DC3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #DEE2E6' }}>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setSelectedBusiness(null)
                    setReports([])
                    setMediaLinks([''])
                    setSelectedFile(null)
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#6C757D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '100px'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleReportUpload}
                  disabled={!selectedFile || uploadingId === selectedBusiness?.id}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: (!selectedFile || uploadingId === selectedBusiness?.id) ? '#CED4DA' : '#007BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!selectedFile || uploadingId === selectedBusiness?.id) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '100px'
                  }}
                >
                  {uploadingId === selectedBusiness?.id ? '업로드 중...' : '업로드'}
                </button>
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
                          리포트 #{reports.length - idx}
                        </span>
                        <span style={{ color: '#6C757D', fontSize: '13px' }}>
                          {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <button
                          onClick={() => deleteReport(report.id)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#DC3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            minWidth: '60px'
                          }}
                        >
                          삭제
                        </button>
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

      {/* 히스토리 전용 모달 */}
      {showHistoryModal && selectedBusiness && (
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
            width: '600px',
            maxWidth: '90%',
            maxHeight: '70vh',
            overflow: 'auto'
          }} className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#212529' }}>
                {selectedBusiness.name} - 리포트 히스토리
              </h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false)
                  setSelectedBusiness(null)
                  setReports([])
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

            {/* 리포트 목록 - 추가 모달과 동일한 형식 */}
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
                        리포트 #{reports.length - idx}
                      </span>
                      <span style={{ color: '#6C757D', fontSize: '13px' }}>
                        {new Date(report.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      <button
                        onClick={() => deleteReport(report.id)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#DC3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6C757D', textAlign: 'center', padding: '32px' }}>
                아직 업로드된 리포트가 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}