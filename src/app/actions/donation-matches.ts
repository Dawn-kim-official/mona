'use server'

import { createClient } from '@/lib/supabase-server'

export async function createDonationMatch(
  donationId: string,
  beneficiaryId: string,
  userId: string
) {
  const supabase = createClient()
  
  // 먼저 기존 매칭이 있는지 확인
  const { data: existingMatch } = await supabase
    .from('donation_matches')
    .select('id')
    .eq('donation_id', donationId)
    .eq('beneficiary_id', beneficiaryId)
    .maybeSingle()

  if (existingMatch) {
    // 기존 매칭이 있으면 업데이트
    const { error } = await supabase
      .from('donation_matches')
      .update({
        status: 'proposed',
        proposed_at: new Date().toISOString(),
        proposed_by: userId
      })
      .eq('id', existingMatch.id)
    
    return { error }
  } else {
    // 기존 매칭이 없으면 새로 생성
    const { error } = await supabase
      .from('donation_matches')
      .insert({
        donation_id: donationId,
        beneficiary_id: beneficiaryId,
        status: 'proposed',
        proposed_at: new Date().toISOString(),
        proposed_by: userId
      })
    
    return { error }
  }
}

export async function updateDonationStatus(donationId: string, status: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('donations')
    .update({ status })
    .eq('id', donationId)
  
  return { error }
}