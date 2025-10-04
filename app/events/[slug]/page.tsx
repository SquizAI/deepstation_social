import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventLandingClient } from './event-landing-client'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  return {
    title: `${event.title} | DeepStation Events`,
    description: event.meta_description || event.short_description || event.description,
    openGraph: {
      title: event.title,
      description: event.short_description || event.description,
      images: event.og_image_url || event.cover_image_url ? [event.og_image_url || event.cover_image_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.short_description || event.description,
      images: event.og_image_url || event.cover_image_url ? [event.og_image_url || event.cover_image_url] : [],
    },
  }
}

export default async function EventLandingPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) {
    notFound()
  }

  // Track page view (you can implement analytics tracking here)

  return <EventLandingClient event={event} />
}
