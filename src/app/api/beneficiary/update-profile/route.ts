import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function PUT(request: Request) {
  try {
    // ✅ 1. 인증 확인
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ 2. Beneficiary 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'beneficiary') {
      return NextResponse.json({ error: 'Beneficiary access required' }, { status: 403 })
    }

    // ✅ 3. updateData만 받음 (userId는 인증된 user.id 사용)
    const body = await request.json()
    const { updateData } = body

    if (!updateData) {
      return NextResponse.json({ error: 'Update data required' }, { status: 400 })
    }

    // ✅ 4. 본인 데이터만 수정
    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updateData)
      .eq('user_id', user.id)  // ✅ 인증된 user.id 사용
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