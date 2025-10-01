'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Donation {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  pickup_location: string
  businesses?: {
    name: string
  }
}

export default function AdminPickupSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [donation, setDonation] = useState<Donation | null>(null)
  const [formData, setFormData] = useState({
    pickup_date: '',
    pickup_time: '',
    pickup_staff: '',
    vehicle_info: '',
    notes: ''
  })

  useEffect(() => {
    fetchDonation()
  }, [params.id])

  async function fetchDonation() {
    const { data } = await supabase
      .from('donations')
      .select(`
        *,
        businesses(name)
      `)
      .eq('id', params.id)
      .single()

    if (data) {
      setDonation(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    console.log('=== 픽업 일정 설정 시작 ===')
    console.log('Donation ID:', params.id)
    console.log('Form data:', formData)

    try {
      // Create pickup schedule
      console.log('Inserting pickup schedule...')
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('pickup_schedules')
        .insert({
          donation_id: params.id,
          pickup_date: formData.pickup_date,
          pickup_time: formData.pickup_time,
          pickup_staff: formData.pickup_staff,
          vehicle_info: formData.vehicle_info,
          notes: formData.notes,
          status: 'scheduled'
        })
        .select()

      if (scheduleError) {
        console.error('Schedule insert error:', scheduleError)
        throw scheduleError
      }

      console.log('Schedule created successfully:', scheduleData)

      // Update donation status to pickup_scheduled (픽업 예정)
      console.log('Updating donation status to pickup_scheduled...')
      const { data: updatedDonation, error: donationError } = await supabase
        .from('donations')
        .update({ status: 'pickup_scheduled' })
        .eq('id', params.id)
        .select()

      if (donationError) {
        console.error('Donation update error:', donationError)
        throw donationError
      }

      console.log('Donation updated successfully:', updatedDonation)

      alert('픽업 일정이 성공적으로 설정되었습니다.')
      router.push('/admin/donations')
    } catch (error: any) {
      console.error('Error setting pickup schedule:', error)
      alert(`픽업 일정 설정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!donation) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/donations">
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            color: '#6C757D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '16px' }}>←</span> 목록으로
          </button>
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
          픽업 일정 설정
        </h1>
      </div>

      {/* Donation Info */}
      <div style={{
        backgroundColor: '#F8F9FA',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#212529' }}>
          기부 정보
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#6C757D' }}>품명: </span>
            <span style={{ fontSize: '14px', color: '#212529' }}>{donation.name || donation.description}</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#6C757D' }}>회원사: </span>
            <span style={{ fontSize: '14px', color: '#212529' }}>{donation.businesses?.name}</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#6C757D' }}>수량: </span>
            <span style={{ fontSize: '14px', color: '#212529' }}>{donation.quantity}{donation.unit || 'kg'}</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#6C757D' }}>픽업 장소: </span>
            <span style={{ fontSize: '14px', color: '#212529' }}>{donation.pickup_location}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 픽업 날짜 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              픽업 날짜
            </label>
            <input
              type="date"
              value={formData.pickup_date}
              onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#80BDFF'}
              onBlur={(e) => e.target.style.borderColor = '#CED4DA'}
            />
          </div>

          {/* 픽업 시간 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              픽업 시간
            </label>
            <input
              type="time"
              value={formData.pickup_time}
              onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#80BDFF'}
              onBlur={(e) => e.target.style.borderColor = '#CED4DA'}
            />
          </div>

          {/* 픽업 담당자 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              픽업 담당자
            </label>
            <input
              type="text"
              value={formData.pickup_staff}
              onChange={(e) => setFormData({ ...formData, pickup_staff: e.target.value })}
              required
              placeholder="담당자 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#80BDFF'}
              onBlur={(e) => e.target.style.borderColor = '#CED4DA'}
            />
          </div>

          {/* 차량 정보 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              차량 정보
            </label>
            <input
              type="text"
              value={formData.vehicle_info}
              onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
              required
              placeholder="예: 1톤 트럭 (12가 3456)"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#80BDFF'}
              onBlur={(e) => e.target.style.borderColor = '#CED4DA'}
            />
          </div>

          {/* 비고 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#212529'
            }}>
              비고 (선택)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="픽업 시 참고사항을 입력하세요"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CED4DA',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#80BDFF'}
              onBlur={(e) => e.target.style.borderColor = '#CED4DA'}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Link href="/admin/donations">
              <button
                type="button"
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
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
                취소
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: loading ? '#6C757D' : '#28A745',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#218838')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#28A745')}
            >
              {loading ? '설정 중...' : '픽업 일정 설정'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}