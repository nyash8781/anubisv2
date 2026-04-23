import { Resend } from 'resend'

let client: Resend | null = null

function getResend(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    client = new Resend(apiKey)
  }
  return client
}

export interface SendEmailOptions {
  to: string
  from: string
  subject: string
  body: string
  signature?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ id: string }> {
  const resend = getResend()
  const htmlBody = opts.body.replace(/\n/g, '<br>')
  const htmlSig = opts.signature
    ? `<br><br><hr style="border:none;border-top:1px solid #eee;margin:16px 0"><div style="color:#666;font-size:12px">${opts.signature.replace(/\n/g, '<br>')}</div>`
    : ''
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.5">${htmlBody}${htmlSig}</div>`
  const text = opts.body + (opts.signature ? `\n\n--\n${opts.signature}` : '')
  const { data, error } = await resend.emails.send({
    from: opts.from,
    to: [opts.to],
    subject: opts.subject,
    html,
    text,
  })
  if (error) throw new Error(error.message)
  return { id: data!.id }
}
