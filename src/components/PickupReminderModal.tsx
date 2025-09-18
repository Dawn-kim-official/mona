'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface PickupReminderModalProps {
  userType: 'business' | 'beneficiary'
  userId: string
}

interface UpcomingPickup {
  id: string
  name: string
  pickupDate: Date
  daysUntilPickup: number
  location?: string
}

export default function PickupReminderModal({ 
  userType, 
  userId 
}: PickupReminderModalProps) {
  const [show, setShow] = useState(false)
  const [upcomingPickups, setUpcomingPickups] = useState<UpcomingPickup[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 세션 스토리지 확인 - 오늘 이미 확인했으면 표시하지 않음
    const today = new Date().toDateString()
    const lastChecked = sessionStorage.getItem(`pickup_reminder_${userId}`)
    
    if (lastChecked !== today) {
      checkUpcomingPickups()
    }
  }, [userId])

  async function checkUpcomingPickups() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      if (userType === 'business') {
        // 기부기업: 자신의 픽업 예정 기부품 확인
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (business) {
          const { data: donations } = await supabase
            .from('donations')
            .select('*')
            .eq('business_id', business.id)
            .eq('status', 'pickup_scheduled')
            .gte('pickup_deadline', today.toISOString())
            .lt('pickup_deadline', dayAfterTomorrow.toISOString())

          if (donations && donations.length > 0) {
            const pickups = donations.map(donation => {
              const pickupDate = new Date(donation.pickup_deadline)
              const diffTime = pickupDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              
              return {
                id: donation.id,
                name: donation.name || donation.description,
                pickupDate: pickupDate,
                daysUntilPickup: diffDays,
                location: donation.pickup_location
              }
            })
            
            setUpcomingPickups(pickups)
            setShow(true)
          }
        }
      } else {
        // 수혜기관: 수령 예정 기부품 확인
        const { data: beneficiary } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (beneficiary) {
          const { data: matches } = await supabase
            .from('donation_matches')
            .select(`
              *,
              donations!inner (
                id,
                name,
                description,
                pickup_deadline,
                pickup_location,
                status
              )
            `)
            .eq('beneficiary_id', beneficiary.id)
            .eq('donations.status', 'pickup_scheduled')
            .gte('donations.pickup_deadline', today.toISOString())
            .lt('donations.pickup_deadline', dayAfterTomorrow.toISOString())

          if (matches && matches.length > 0) {
            const pickups = matches.map(match => {
              const donation = match.donations
              const pickupDate = new Date(donation.pickup_deadline)
              const diffTime = pickupDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              
              return {
                id: donation.id,
                name: donation.name || donation.description,
                pickupDate: pickupDate,
                daysUntilPickup: diffDays,
                location: donation.pickup_location
              }
            })
            
            setUpcomingPickups(pickups)
            setShow(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming pickups:', error)
    }
  }

  function handleConfirm() {
    // 오늘 날짜로 세션 스토리지에 저장
    const today = new Date().toDateString()
    sessionStorage.setItem(`pickup_reminder_${userId}`, today)
    
    setShow(false)
  }

  if (!show || upcomingPickups.length === 0) return null

  // 오늘 픽업과 내일 픽업 구분
  const todayPickups = upcomingPickups.filter(p => p.daysUntilPickup === 0)
  const tomorrowPickups = upcomingPickups.filter(p => p.daysUntilPickup === 1)

  // 메시지 생성
  const getTitle = () => {
    if (todayPickups.length > 0 && tomorrowPickups.length > 0) {
      return '📦 픽업 일정 알림'
    } else if (todayPickups.length > 0) {
      return '🚨 오늘 픽업 예정'
    } else {
      return '📅 내일 픽업 예정'
    }
  }

  const getMessage = () => {
    if (userType === 'business') {
      if (todayPickups.length > 0 && tomorrowPickups.length > 0) {
        return `오늘과 내일 픽업 예정인 기부품이 있습니다.`
      } else if (todayPickups.length > 0) {
        return `오늘 픽업 예정인 기부품이 있습니다. 픽업 준비를 완료해 주세요.`
      } else {
        return `내일 픽업 예정인 기부품이 있습니다. 미리 준비해 주세요.`
      }
    } else {
      if (todayPickups.length > 0 && tomorrowPickups.length > 0) {
        return `오늘과 내일 수령 예정인 기부품이 있습니다.`
      } else if (todayPickups.length > 0) {
        return `오늘 수령 예정인 기부품이 있습니다. 수령 준비를 완료해 주세요.`
      } else {
        return `내일 수령 예정인 기부품이 있습니다. 미리 준비해 주세요.`
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          cursor: 'not-allowed'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header with Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: todayPickups.length > 0 ? '#FFF3CD' : '#E3F2FD',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {todayPickups.length > 0 ? '🚨' : '📅'}
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            fontFamily: 'Montserrat, sans-serif',
            margin: 0
          }}>
            {getTitle()}
          </h2>
        </div>

        {/* Message */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#212529',
          marginBottom: '24px',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          {getMessage()}
        </p>

        {/* Pickup List */}
        <div style={{
          backgroundColor: '#F8F9FA',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          {todayPickups.length > 0 && (
            <div style={{ marginBottom: tomorrowPickups.length > 0 ? '16px' : 0 }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#DC3545',
                marginBottom: '12px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                ⏰ 오늘 {userType === 'business' ? '픽업' : '수령'} 예정
              </h3>
              {todayPickups.map(pickup => (
                <div key={pickup.id} style={{
                  backgroundColor: 'white',
                  borderLeft: '3px solid #DC3545',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#212529',
                    marginBottom: '4px',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {pickup.name}
                  </div>
                  {pickup.location && (
                    <div style={{
                      fontSize: '13px',
                      color: '#6C757D',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                      📍 {pickup.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tomorrowPickups.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#FF8C00',
                marginBottom: '12px',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                📅 내일 {userType === 'business' ? '픽업' : '수령'} 예정
              </h3>
              {tomorrowPickups.map(pickup => (
                <div key={pickup.id} style={{
                  backgroundColor: 'white',
                  borderLeft: '3px solid #FF8C00',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#212529',
                    marginBottom: '4px',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {pickup.name}
                  </div>
                  {pickup.location && (
                    <div style={{
                      fontSize: '13px',
                      color: '#6C757D',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                      📍 {pickup.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleConfirm}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFFFFF',
            backgroundColor: '#02391f',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Montserrat, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          확인
        </button>
      </div>
    </>
  )
}