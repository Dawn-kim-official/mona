import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailTemplate) {
  try {
    const data = await resend.emails.send({
      from: 'MONA B2B <noreply@mona.ai.kr>',
      to,
      subject,
      html,
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}