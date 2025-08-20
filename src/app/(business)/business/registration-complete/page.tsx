import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RegistrationCompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">가입 신청 완료</CardTitle>
          <CardDescription className="mt-2">
            사업자 등록 신청이 성공적으로 접수되었습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">다음 단계</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>관리자가 제출하신 정보를 검토합니다 (1-2 영업일)</li>
              <li>승인되면 이메일로 알림을 받으실 수 있습니다</li>
              <li>승인 후 서비스 계약서에 서명하시면 이용이 가능합니다</li>
            </ol>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              문의사항이 있으시면 support@monaimpact.com으로 연락주세요
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                로그인 페이지로 돌아가기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}