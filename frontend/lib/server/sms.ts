export interface SendSmsOptions {
  to: string
  from: string
  message: string
}

export async function sendSms(opts: SendSmsOptions): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)')
  }
  const twilio = (await import('twilio')).default
  const message = await twilio(accountSid, authToken).messages.create({
    body: opts.message,
    from: opts.from,
    to: opts.to,
  })
  return { sid: message.sid }
}
