import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 모드에서 오류 오버레이 비활성화
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // React의 오류 오버레이 비활성화
  reactStrictMode: false,
};

export default nextConfig;
