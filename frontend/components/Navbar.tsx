'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-gray-900 tracking-tight">
          DocStore
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">{userEmail}</span>
          <Link
            href="/upload"
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Upload
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
