'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function BusinessRegistrationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    businessName: '',
    representativeName: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  })
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessLicenseFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('사용자 인증이 필요합니다')

      let businessLicenseUrl = ''
      
      if (businessLicenseFile) {
        const fileExt = businessLicenseFile.name.split('.').pop()
        const fileName = `${user.id}/business-license.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('business-licenses')
          .upload(fileName, businessLicenseFile, {
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('business-licenses')
          .getPublicUrl(fileName)

        businessLicenseUrl = publicUrl
      }

      const { error: insertError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: formData.businessName,
          representative_name: formData.representativeName,
          business_license_url: businessLicenseUrl,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website || null,
          status: 'pending'
        })

      if (insertError) throw insertError

      router.push('/business/registration-complete')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>사업자 등록</CardTitle>
            <CardDescription>
              비즈니스 정보를 입력해주세요. 승인 후 서비스를 이용하실 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">사업자명 *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeName">대표자명 *</Label>
                <Input
                  id="representativeName"
                  name="representativeName"
                  value={formData.representativeName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicense">사업자 등록증 * (PDF/JPG)</Label>
                <Input
                  id="businessLicense"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호 *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="010-0000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소 *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">웹사이트</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '제출 중...' : '가입 신청'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}