'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 어드민 대시보드 대신 기부 관리 페이지로 리다이렉트
    router.push('/admin/donations')
  }, [router])
  
  return null
}