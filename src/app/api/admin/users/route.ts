import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
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

    const { userIds } = await request.json()
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    
    const usersWithEmail = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const { data: userData, error } = await adminClient.auth.admin.getUserById(userId)
          
          if (!error && userData?.user) {
            return {
              userId,
              email: userData.user.email || '-'
            }
          }
        } catch (err) {
          console.error('Error fetching user email:', err)
        }
        return { userId, email: '-' }
      })
    )

    return NextResponse.json({ users: usersWithEmail })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to fetch user emails' }, { status: 500 })
  }
}