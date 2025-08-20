import { createClient } from '@supabase/supabase-js'

// 환경 변수 직접 설정 (개발용)
const supabaseUrl = 'https://ipieplfljolfssmvxpub.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWVwbGZsam9sZnNzbXZ4cHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjAwMzksImV4cCI6MjA3MDYzNjAzOX0.XyTg4LtzFaXc__e_68Sc6dYLypTbiDXkwTHdossiotE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  try {
    // 1. 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@business.com',
      password: 'Test123456!',
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('User created:', authData.user?.id)

    // 2. Profile 생성
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role: 'business'
        })

      if (profileError) {
        console.error('Profile error:', profileError)
      } else {
        console.log('Profile created successfully')
      }
    }

    // 3. 관리자 계정 생성
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@monaimpact.com',
      password: 'Admin123456!',
    })

    if (adminError) {
      console.error('Admin auth error:', adminError)
      return
    }

    if (adminData.user) {
      const { error: adminProfileError } = await supabase
        .from('profiles')
        .insert({
          id: adminData.user.id,
          email: adminData.user.email,
          role: 'admin'
        })

      if (adminProfileError) {
        console.error('Admin profile error:', adminProfileError)
      } else {
        console.log('Admin profile created successfully')
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser()