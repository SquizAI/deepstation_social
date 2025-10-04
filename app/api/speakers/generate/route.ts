import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSpeakerAnnouncement, regeneratePlatformAnnouncement } from '@/lib/ai/speaker-announcement'
import type { Speaker } from '@/lib/types/speakers'
import type { Platform } from '@/lib/types/posts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/speakers/generate
 * Generate speaker announcements using AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { speakerId, platform, eventLink } = body

    if (!speakerId) {
      return NextResponse.json({ error: 'Speaker ID is required' }, { status: 400 })
    }

    // Fetch speaker data
    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', speakerId)
      .eq('user_id', user.id)
      .single()

    if (speakerError || !speaker) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }

    // Generate announcements
    if (platform) {
      // Regenerate single platform
      const result = await regeneratePlatformAnnouncement(
        speaker as Speaker,
        platform as Platform,
        eventLink
      )

      // Update in database
      const { data: existingAnnouncement } = await supabase
        .from('speaker_announcements')
        .select('generated_content')
        .eq('speaker_id', speakerId)
        .single()

      const updatedContent = {
        ...(existingAnnouncement?.generated_content || {}),
        [platform]: result.content
      }

      await supabase
        .from('speaker_announcements')
        .upsert({
          speaker_id: speakerId,
          generated_content: updatedContent,
          status: 'draft'
        })

      return NextResponse.json({
        success: true,
        platform,
        content: result.content,
        characterCount: result.characterCount,
        withinLimit: result.withinLimit
      })
    } else {
      // Generate all platforms
      const results = await generateSpeakerAnnouncement(speaker as Speaker, eventLink)

      const content = {
        linkedin: results.linkedin?.content || '',
        instagram: results.instagram?.content || '',
        twitter: results.twitter?.content || '',
        discord: results.discord?.content || ''
      }

      // Save to database
      await supabase.from('speaker_announcements').upsert({
        speaker_id: speakerId,
        generated_content: content,
        status: 'draft'
      })

      return NextResponse.json({
        success: true,
        content,
        results: Object.entries(results).map(([platform, data]) => ({
          platform,
          characterCount: data.characterCount,
          withinLimit: data.withinLimit
        }))
      })
    }
  } catch (error) {
    console.error('Error generating speaker announcements:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate announcements'
      },
      { status: 500 }
    )
  }
}
