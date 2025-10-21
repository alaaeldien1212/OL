import type { Metadata } from 'next'
import { Almarai, Cairo } from 'next/font/google'
import './globals.css'

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-almarai',
})

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'المكتبة الإلكترونية للقصص',
  description: 'مكتبة قصص حديثة وتفاعلية للأطفال مع واجهة سهلة وجميلة',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'المكتبة الإلكترونية للقصص',
    description: 'مكتبة قصص حديثة وتفاعلية للأطفال',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${almarai.variable} ${cairo.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="description" content="مكتبة قصص حديثة وتفاعلية للأطفال" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-arabic antialiased bg-cloud text-white">
        {children}
      </body>
    </html>
  )
}
