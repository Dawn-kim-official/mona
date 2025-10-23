import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, updateData } = body
    
    if (!userId || !updateData) {
      return NextResponse.json({ error: 'User ID and update data required' }, { status: 400 })
    }

    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // 일반 클라이언트로 시도 (RLS 적용됨)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('Updating beneficiary profile for user:', userId)
    console.log('Update data:', updateData)
    
    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updateData)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating beneficiary profile:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}