import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
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