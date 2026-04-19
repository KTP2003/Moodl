'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Fugaz_One } from 'next/font/google'
import { useAuth } from '@/context/AuthContext'

const fugaz = Fugaz_One({ subsets: ['latin'], weight: ['400'] })

export default function AppHeader() {
  const router = useRouter()
  const { currentUser, logout, loading } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logout()
      router.push('/dashboard?mode=login&loggedOut=1')
    } catch (e) {
      setLogoutError(e?.message || 'Failed to log out.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="p-4 sm:p-8 items-center flex justify-between gap-4">
      <Link href="/">
        <h1 className={'text-base sm:text-lg textGradient ' + fugaz.className}>
          Moodl
        </h1>
      </Link>

      <nav className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base">
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:underline font-medium"
        >
          Dashboard
        </Link>

        {loading ? null : currentUser ? (
          <>
            <span className="text-slate-500 hidden sm:inline max-w-[220px] truncate">
              {currentUser.email || 'Signed in'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-indigo-600 hover:underline font-medium disabled:opacity-60"
            >
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/dashboard?mode=login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Login
            </Link>
            <Link
              href="/dashboard?mode=register"
              className="text-indigo-600 hover:underline font-medium"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>

      {logoutError ? (
        <p className="sr-only" role="alert">
          {logoutError}
        </p>
      ) : null}
    </header>
  )
}

