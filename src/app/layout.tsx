import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "@/lib/intercept-console-error";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://platform.monaofficial.co'),
  title: {
    default: 'Mona - B2B 기부 플랫폼',
    template: '%s | Mona'
  },
  description: '기업의 사회적 책임을 실현하는 B2B 기부 플랫폼. 효율적인 기부 관리와 ESG 리포트를 통해 지속가능한 사회공헌을 지원합니다.',
  keywords: ['B2B 기부', '기업 기부', 'ESG', '사회공헌', '수혜기관', '기부 플랫폼', '사회적 책임'],
  authors: [{ name: 'Mona Official' }],
  creator: 'Mona Official',
  publisher: 'Mona Official',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://platform.monaofficial.co',
    title: 'Mona - B2B 기부 플랫폼',
    description: '기업의 사회적 책임을 실현하는 B2B 기부 플랫폼. 효율적인 기부 관리와 ESG 리포트를 통해 지속가능한 사회공헌을 지원합니다.',
    siteName: 'Mona',
    images: [
      {
        url: '/mona_logo.png',
        width: 1200,
        height: 630,
        alt: 'Mona B2B 기부 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mona - B2B 기부 플랫폼',
    description: '기업의 사회적 책임을 실현하는 B2B 기부 플랫폼',
    images: ['/mona_logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
    yandex: '',
    yahoo: '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${montserrat.variable} antialiased`}
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        {children}
      </body>
    </html>
  );
}
