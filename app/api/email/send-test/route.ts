import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, subject, content, template_id } = await request.json()

    if (!email || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get template if specified
    let htmlContent = content
    if (template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('html_content')
        .eq('id', template_id)
        .single()

      if (template) {
        htmlContent = template.html_content
          .replace(/{{subject}}/g, subject)
          .replace(/{{content}}/g, content)
          .replace(/{{firstName}}/g, 'Test')
          .replace(/{{lastName}}/g, 'User')
          .replace(/{{email}}/g, email)
          .replace(/{{unsubscribe_url}}/g, '#')
      }
    }

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, we'll just log the email
    console.log('Sending test email:', {
      to: email,
      subject,
      html: htmlContent,
    })

    // Example with Resend (you'll need to install and configure):
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'DeepStation <noreply@deepstation.ai>',
    //   to: email,
    //   subject: `[TEST] ${subject}`,
    //   html: htmlContent,
    // })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}
