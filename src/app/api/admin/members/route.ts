import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // 인증된 사용자인지 확인
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // 병렬로 두 테이블 데이터 가져오기
    const [businessesResult, beneficiariesResult] = await Promise.all([
      supabaseAdmin
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false })
    ])

    if (businessesResult.error) {
      console.error('Error fetching businesses:', businessesResult.error)
    }

    if (beneficiariesResult.error) {
      console.error('Error fetching beneficiaries:', beneficiariesResult.error)
    }

    // 수혜기관 이메일 정보 보완
    let beneficiariesWithEmail = beneficiariesResult.data || []
    if (beneficiariesResult.data && beneficiariesResult.data.length > 0) {
      beneficiariesWithEmail = await Promise.all(
        beneficiariesResult.data.map(async (beneficiary) => {
          if (beneficiary.user_id) {
            try {
              const { data: profileData } = await supabaseAdmin
                .from('profiles')
                .select('email')
                .eq('id', beneficiary.user_id)
                .single()
              
              return {
                ...beneficiary,
                email: profileData?.email || beneficiary.email || '-'
              }
            } catch (err) {
              console.error('Error fetching profile:', err)
              return { ...beneficiary, email: beneficiary.email || '-' }
            }
          }
          return { ...beneficiary, email: beneficiary.email || '-' }
        })
      )
    }

    return NextResponse.json({
      businesses: businessesResult.data || [],
      beneficiaries: beneficiariesWithEmail
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}