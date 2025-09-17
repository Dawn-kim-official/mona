'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface MatchingNotificationModalProps {
  userType: 'business' | 'beneficiary'
  userId: string
  onConfirm: () => void
}

export default function MatchingNotificationModal({ 
  userType, 
  userId, 
  onConfirm 
}: MatchingNotificationModalProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [show, setShow] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    checkNewMatches()
  }, [])

  async function checkNewMatches() {
    try {
      if (userType === 'business') {
        // 기부기업: 자신의 기부품이 매칭된 경우 확인
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (business) {
          // notification_confirmed_at이 null이거나 매칭 시간보다 이전인 경우
          const { data: donations } = await supabase
            .from('donations')
            .select('*, donation_matches(*)')
            .eq('business_id', business.id)
            .not('donation_matches', 'is', null)

          const unconfirmedMatches = donations?.filter(donation => {
            return donation.donation_matches?.some((match: any) => 
              !donation.notification_confirmed_at || 
              new Date(donation.notification_confirmed_at) < new Date(match.proposed_at)
            )
          })

          if (unconfirmedMatches && unconfirmedMatches.length > 0) {
            setMatchCount(unconfirmedMatches.length)
            setShow(true)
          }
        }
      } else {
        // 수혜기관: 새로운 매칭 제안을 받은 경우
        const { data: beneficiary } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (beneficiary) {
          const { data: matches } = await supabase
            .from('donation_matches')
            .select('*')
            .eq('beneficiary_id', beneficiary.id)
            .eq('status', 'proposed')
            .is('notification_confirmed_at', null)

          if (matches && matches.length > 0) {
            setMatchCount(matches.length)
            setShow(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking matches:', error)
    }
  }

  async function handleConfirm() {
    if (!isChecked) return

    try {
      const now = new Date().toISOString()
      
      if (userType === 'business') {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (business) {
          // 모든 관련 donations의 notification_confirmed_at 업데이트
          await supabase
            .from('donations')
            .update({ notification_confirmed_at: now })
            .eq('business_id', business.id)
        }
      } else {
        const { data: beneficiary } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (beneficiary) {
          // 모든 제안된 매칭의 notification_confirmed_at 업데이트
          await supabase
            .from('donation_matches')
            .update({ notification_confirmed_at: now })
            .eq('beneficiary_id', beneficiary.id)
            .eq('status', 'proposed')
            .is('notification_confirmed_at', null)
        }
      }

      setShow(false)
      onConfirm()
    } catch (error) {
      console.error('Error confirming notification:', error)
    }
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop - 클릭 방지 */}
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
        maxWidth: '480px',
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#E3F2FD',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1976D2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            fontFamily: 'Montserrat, sans-serif',
            margin: 0
          }}>
            모나 플랫폼 이용 안내
          </h2>
        </div>

        {/* Content */}
        <div style={{
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.5',
            color: '#212529',
            marginBottom: '16px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            모나 플랫폼을 통해 매칭된 파트너 기관에는 <span style={{ color: '#DC3545', fontWeight: '600' }}>직접 연락할 수 없습니다.</span>
          </p>
          <p style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#6C757D',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            이는 회원가입 시 동의하신 서비스 이용약관에 명시된 내용입니다.
          </p>
          {matchCount > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#ffd02010',
              borderLeft: '3px solid #ffd020',
              borderRadius: '4px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#02391f',
                fontWeight: '500',
                margin: 0,
                fontFamily: 'Montserrat, sans-serif'
              }}>
                🎉 새로운 매칭이 {matchCount}건 있습니다!
              </p>
            </div>
          )}
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '24px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              cursor: 'pointer',
              accentColor: '#02391f'
            }}
          />
          <span style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#495057',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            위 내용을 확인하였으며, 모나 플랫폼의 이용 규정을 준수하겠습니다.
          </span>
        </label>

        {/* Button */}
        <button
          onClick={handleConfirm}
          disabled={!isChecked}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: '600',
            color: isChecked ? '#FFFFFF' : '#ADB5BD',
            backgroundColor: isChecked ? '#02391f' : '#E9ECEF',
            border: 'none',
            borderRadius: '8px',
            cursor: isChecked ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            fontFamily: 'Montserrat, sans-serif'
          }}
          onMouseEnter={(e) => {
            if (isChecked) {
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            if (isChecked) {
              e.currentTarget.style.opacity = '1'
            }
          }}
        >
          확인
        </button>
      </div>
    </>
  )
}