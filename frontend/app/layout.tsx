import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DocStore',
  description: 'Your intelligent document library.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={inter.className}>
        {user && <Navbar userEmail={user.email ?? ''} />}
        {children}
      </body>
    </html>
  )
}
