'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function ManualSignupPage() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  async function createManualUser() {
    setLoading(true)
    try {
      // 1. 현재 사용자 확인
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
      
      if (users && users.length > 0) {
        setResult({ error: '이미 존재하는 이메일입니다.' })
        return
      }

      // 2. UUID 생성
      const newUserId = userId || crypto.randomUUID()

      // 3. Profile 생성
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          email: email,
          role: 'business'
        })
        .select()
        .single()

      if (profileError) {
        setResult({ error: profileError.message })
        return
      }

      // 4. Business 생성
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: newUserId,
          name: '테스트 회사',
          representative_name: '테스트 담당자',
          business_license_url: 'https://example.com/license.pdf',
          email: email,
          phone: '010-0000-0000',
          address: '123-45-67890',
          website: 'https://example.com',
          status: 'approved',
          contract_signed: true,
          approved_at: new Date().toISOString()
        })
        .select()
        .single()

      if (businessError) {
        setResult({ error: businessError.message })
        return
      }

      setResult({
        success: true,
        profile,
        business,
        message: `사용자가 생성되었습니다. ID: ${newUserId}`
      })

    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>수동 사용자 생성</CardTitle>
        <CardDescription>
          Supabase Auth를 우회하여 직접 사용자를 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="text"
            placeholder="test2@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="userId">사용자 ID (선택사항)</Label>
          <Input
            id="userId"
            type="text"
            placeholder="자동 생성됨"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <Button 
          onClick={createManualUser} 
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? '생성 중...' : '사용자 생성'}
        </Button>

        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>⚠️ 주의: 이 방법으로 생성된 사용자는 비밀번호가 없어 일반 로그인이 불가능합니다.</p>
          <p>개발 테스트용으로만 사용하세요.</p>
        </div>
      </CardContent>
    </Card>
  )
}