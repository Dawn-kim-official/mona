'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error details:', {
          error,
          message: error.message,
          status: error.status,
          code: error.code
        })
        
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
        }
        throw error
      }

      if (data.user) {
        // profiles 테이블에서 role 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.log('Profile not found, creating...')
          // profile이 없으면 생성
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              role: 'business'
            })
        }

        // role에 따라 리다이렉트
        if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          // business 사용자인 경우 등록 여부 확인
          const { data: business } = await supabase
            .from('businesses')
            .select('id, status')
            .eq('user_id', data.user.id)
            .single()

          if (!business) {
            // 회원가입 시 이미 사업자 정보를 입력받았으므로, business가 없는 경우는 오류
            setError('사업자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
            return
          } else {
            // 모든 비즈니스 사용자는 바로 대시보드로 이동
            router.push('/business/dashboard')
          }
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>MONA B2B 플랫폼에 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}