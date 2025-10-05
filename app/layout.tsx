import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DeepStation - AI-Powered Social Media Automation',
  description: 'Open-source platform for automating social media across LinkedIn, Instagram, X, and Discord. Schedule posts, generate AI content, and track analytics - all in one place.',
  keywords: ['social media automation', 'AI content generation', 'LinkedIn automation', 'Instagram scheduler', 'Twitter automation', 'Discord bot', 'open source'],
  authors: [{ name: 'DeepStation', url: 'https://deepstation.netlify.app' }],
  creator: 'DeepStation',
  publisher: 'DeepStation',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://deepstation.netlify.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepstation.netlify.app',
    siteName: 'DeepStation',
    title: 'DeepStation - AI-Powered Social Media Automation',
    description: 'Open-source platform for automating social media across LinkedIn, Instagram, X, and Discord. Schedule posts, generate AI content, and track analytics.',
    images: [
      {
        url: 'https://deepstation.netlify.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DeepStation - AI-Powered Social Media Automation',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@deepstation',
    creator: '@deepstation',
    title: 'DeepStation - AI-Powered Social Media Automation',
    description: 'Open-source platform for automating social media across LinkedIn, Instagram, X, and Discord.',
    images: ['https://deepstation.netlify.app/og-image.png'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
