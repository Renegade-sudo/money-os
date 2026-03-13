import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/layout/SessionProvider'

export const metadata: Metadata = {
  title: 'Money OS — Personal Financial Operating System',
  description: 'Your personal financial control center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950 text-zinc-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
