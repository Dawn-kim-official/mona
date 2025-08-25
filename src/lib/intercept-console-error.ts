// 개발 환경에서 콘솔 에러 숨기기 (영상 촬영용)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // RLS 관련 에러나 특정 에러 메시지는 무시
    const errorString = args.join(' ');
    if (
      errorString.includes('row-level security policy') ||
      errorString.includes('Error updating match') ||
      errorString.includes('Error detail') ||
      errorString.includes('Error message') ||
      errorString.includes('intercept-console-error')
    ) {
      return;
    }
    // 다른 에러는 그대로 출력
    originalError.apply(console, args);
  };
}