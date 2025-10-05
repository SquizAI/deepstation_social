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

    const { campaign_id } = await request.json()

    if (!campaign_id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('email_subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (subscribersError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 })
    }

    // Get template if specified
    let htmlContent = campaign.content
    if (campaign.template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('html_content')
        .eq('id', campaign.template_id)
        .single()

      if (template) {
        htmlContent = template.html_content
          .replace(/{{subject}}/g, campaign.subject)
          .replace(/{{preview_text}}/g, campaign.preview_text || '')
          .replace(/{{content}}/g, campaign.content)
      }
    }

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sending',
        recipient_count: subscribers.length,
      })
      .eq('id', campaign_id)

    // Send emails to all subscribers (in production, use a queue/background job)
    let successCount = 0
    let failureCount = 0

    for (const subscriber of subscribers) {
      try {
        // Personalize content
        const personalizedContent = htmlContent
          .replace(/{{firstName}}/g, subscriber.first_name || '')
          .replace(/{{lastName}}/g, subscriber.last_name || '')
          .replace(/{{email}}/g, subscriber.email)
          .replace(/{{unsubscribe_url}}/g, `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${subscriber.id}`)

        // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
        // const resend = new Resend(process.env.RESEND_API_KEY)
        // await resend.emails.send({
        //   from: 'DeepStation <noreply@deepstation.ai>',
        //   to: subscriber.email,
        //   subject: campaign.subject,
        //   html: personalizedContent,
        // })

        // For now, just log
        console.log(`Sending email to ${subscriber.email}`)

        // Record successful send
        await supabase.from('campaign_recipients').insert({
          campaign_id,
          subscriber_id: subscriber.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

        successCount++
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error)

        // Record failure
        await supabase.from('campaign_recipients').insert({
          campaign_id,
          subscriber_id: subscriber.id,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })

        failureCount++
      }
    }

    // Update campaign with final stats
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        stats: {
          sent: successCount,
          opened: 0,
          clicked: 0,
          bounced: failureCount,
          unsubscribed: 0,
        },
      })
      .eq('id', campaign_id)

    return NextResponse.json({
      success: true,
      message: 'Campaign sent successfully',
      stats: {
        total: subscribers.length,
        sent: successCount,
        failed: failureCount,
      },
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 })
  }
}
