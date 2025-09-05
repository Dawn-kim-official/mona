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
      
      // Update business record with report URL
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ esg_report_url: publicUrl })
        .eq('id', businessId)
      
      if (updateError) throw updateError
      
      // Refresh data
      await fetchBusinesses()
      alert('ESG 리포트가 성공적으로 업로드되었습니다.')
    } catch (error) {
      // Error uploading report
      alert('리포트 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingId(null)
    }
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
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', fontSize: '13px' }}>ESG 리포트</th>
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
                    {business.esg_report_url ? (
                      <a 
                        href={business.esg_report_url} 
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
                        업로드됨
                      </a>
                    ) : (
                      <span style={{ color: '#6C757D' }}>미업로드</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept=".pdf"
                        disabled={uploadingId === business.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleReportUpload(business.id, file)
                          }
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      <button
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
                        {uploadingId === business.id ? '업로드 중...' : business.esg_report_url ? '재업로드' : '업로드'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}