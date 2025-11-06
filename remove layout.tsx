import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tax Deduction Finder - FinanceFlow',
  description: 'Smart tax deduction tracking and analysis for freelancers and small businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
