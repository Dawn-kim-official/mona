import { createBrowserClient } from '@supabase/ssr'
import { Database } from './supabase-types'

// 임시 하드코딩 버전 (테스트용)
export function createClient() {
  const supabaseUrl = 'https://ipieplfljolfssmvxpub.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWVwbGZsam9sZnNzbXZ4cHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjAwMzksImV4cCI6MjA3MDYzNjAzOX0.XyTg4LtzFaXc__e_68Sc6dYLypTbiDXkwTHdossiotE'

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}