-- 임시로 donations 테이블의 RLS 비활성화 (테스트용)
-- 주의: 이렇게 하면 모든 사용자가 donations 테이블에 접근할 수 있습니다

-- RLS 비활성화
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;

-- 다시 활성화하려면:
-- ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;