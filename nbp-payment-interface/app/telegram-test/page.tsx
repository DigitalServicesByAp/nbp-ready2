'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function TelegramTestPage() {
  const [number, setNumber] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!number.trim() || status === 'sending') return

    setStatus('sending')
    setMessage('')

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ number }),
      })
      const data = await response.json()

      if (response.ok && data.ok) {
        setStatus('success')
        setMessage('Sent to Telegram!')
        setNumber('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Could not reach the server.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold">Telegram Test</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter a number and send it to your Telegram chat.</p>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <div className="field-shell">
            <input
              aria-label="Number"
              inputMode="numeric"
              value={number}
              onChange={(event) => setNumber(event.target.value.replace(/\D/g, ''))}
              placeholder="Enter a number"
            />
          </div>

          <button
            type="submit"
            disabled={!number.trim() || status === 'sending'}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_6px_10px_rgba(39,181,101,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending...' : 'Send to Telegram'}
            <Send aria-hidden="true" className="size-5" />
          </button>
        </form>

        {message && (
          <p
            role="status"
            className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-primary' : 'text-destructive'}`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
