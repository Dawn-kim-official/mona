'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function FixTestUserPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  async function fixTestUser() {
    setLoading(true)
    try {
      // 1. test@test.com 사용자 찾기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 로그인 시도
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@test.com',
          password: '123123'
        })
        
        if (signInError) {
          setResult({ error: '먼저 test@test.com / 123123 으로 로그인해주세요.' })
          return
        }
      }

      const currentUser = user || (await supabase.auth.getUser()).data.user
      
      if (!currentUser) {
        setResult({ error: '사용자를 찾을 수 없습니다.' })
        return
      }

      // 2. 비즈니스 정보 확인
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (existingBusiness) {
        // 이미 존재하면 업데이트
        const { data: updated, error: updateError } = await supabase
          .from('businesses')
          .update({
            status: 'approved',
            contract_signed: true,
            approved_at: new Date().toISOString()
          })
          .eq('user_id', currentUser.id)
          .select()
          .single()

        if (updateError) {
          setResult({ error: updateError.message })
          return
        }

        setResult({ 
          success: true, 
          message: '비즈니스 정보가 업데이트되었습니다.',
          business: updated 
        })
      } else {
        // 없으면 생성
        const { data: newBusiness, error: createError } = await supabase
          .from('businesses')
          .insert({
            user_id: currentUser.id,
            name: '테스트 회사',
            representative_name: '김테스트',
            business_license_url: 'https://example.com/license.pdf',
            email: currentUser.email || 'test@test.com',
            phone: '010-1234-5678',
            address: '123-45-67890',
            website: 'https://testcompany.com',
            status: 'approved',
            contract_signed: true,
            approved_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          setResult({ error: createError.message })
          return
        }

        setResult({ 
          success: true, 
          message: '비즈니스 정보가 생성되었습니다.',
          business: newBusiness 
        })
      }

    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>테스트 사용자 수정</CardTitle>
        <CardDescription>
          test@test.com 계정에 비즈니스 정보를 추가합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fixTestUser} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '처리 중...' : '비즈니스 정보 추가/수정'}
        </Button>

        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>1. 먼저 test@test.com / 123123 으로 로그인하세요</p>
          <p>2. 이 버튼을 클릭하면 비즈니스 정보가 자동으로 생성됩니다</p>
          <p>3. 그 후 정상적으로 대시보드에 접근할 수 있습니다</p>
        </div>
      </CardContent>
    </Card>
  )
}