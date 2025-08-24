'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function SignupPage() {
  // 단계 관리
  const [step, setStep] = useState(1)
  
  // Step 1: 계정 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Step 2: 사업자 정보
  const [businessName, setBusinessName] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [representativePhone, setRepresentativePhone] = useState('')
  const [representativeEmail, setRepresentativeEmail] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    setStep(2)
  }

  const handlePreviousStep = () => {
    setStep(1)
    setError(null)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 필수 필드 검증 (파일 제외)
    if (!businessName || !representativeName || !representativePhone || !representativeEmail || !businessNumber) {
      setError('모든 필수 정보를 입력해주세요')
      setLoading(false)
      return
    }

    try {
      console.log('Signing up with email:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      })

      if (error) {
        console.error('Signup error:', error)
        if (error.message.includes('already registered')) {
          throw new Error('이미 등록된 이메일입니다.')
        }
        throw error
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: 'business'
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          // 이미 존재하는 프로필인 경우 무시
          if (!profileError.message.includes('duplicate')) {
            throw profileError
          }
        }

        // Upload business license
        let businessLicenseUrl = ''
        if (businessLicense) {
          const fileExt = businessLicense.name.split('.').pop()
          const fileName = `${data.user.id}_${Date.now()}.${fileExt}`
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('business-licenses')
            .upload(fileName, businessLicense)
          
          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw uploadError
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('business-licenses')
            .getPublicUrl(fileName)
          
          businessLicenseUrl = publicUrl
        }

        // Create business record
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            user_id: data.user.id,
            name: businessName,
            representative_name: representativeName,
            business_license_url: businessLicenseUrl,
            email: representativeEmail,
            phone: representativePhone,
            address: businessNumber, // 사업자 등록번호를 address 필드에 임시 저장
            website: website || null,
            status: 'approved',
            contract_signed: true,
            approved_at: new Date().toISOString()
          })
        
        if (businessError) {
          console.error('Business creation error:', businessError)
          throw businessError
        }
        
        // 개발 환경에서는 바로 로그인 시도
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          console.error('Auto sign-in error:', signInError)
          alert('회원가입이 완료되었습니다. 로그인 페이지에서 로그인해주세요.')
          router.push('/login')
        } else {
          // 로그인 성공 시 바로 대시보드로 이동
          router.push('/business/dashboard')
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
        <CardTitle>회원가입</CardTitle>
        <CardDescription>
          {step === 1 ? '계정 정보를 입력해주세요' : '사업자 정보를 입력해주세요'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}>
              2
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                실제 이메일 주소를 입력해주세요 (예: user@gmail.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            
            <Button type="submit" className="w-full">
              다음 단계
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">사업자명 *</Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="주식회사 모나"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessNumber">사업자 등록번호 *</Label>
                <Input
                  id="businessNumber"
                  type="text"
                  placeholder="123-45-67890"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representativeName">담당자명 *</Label>
                <Input
                  id="representativeName"
                  type="text"
                  placeholder="홍길동"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representativePhone">담당자 전화번호 *</Label>
                <Input
                  id="representativePhone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={representativePhone}
                  onChange={(e) => setRepresentativePhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representativeEmail">담당자 이메일 *</Label>
                <Input
                  id="representativeEmail"
                  type="email"
                  placeholder="contact@company.com"
                  value={representativeEmail}
                  onChange={(e) => setRepresentativeEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">회사 웹사이트 또는 SNS</Label>
                <Input
                  id="website"
                  type="text"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessLicense">사업자등록증 업로드 (선택)</Label>
              <Input
                id="businessLicense"
                type="file"
                accept=".jpg,.jpeg,.pdf"
                onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PDF 형식만 가능합니다 (나중에 업로드 가능)
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                className="w-full"
                disabled={loading}
              >
                이전 단계
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}