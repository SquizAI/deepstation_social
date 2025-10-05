/**
 * Script to import Luma events into DeepStation database
 * Creates DeepStation organization and imports 5 scraped events
 *
 * Run with: npx tsx scripts/import-luma-events.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 Starting Luma events import...\n');

  // Step 1: Create DeepStation organization
  console.log('📦 Creating DeepStation organization...');

  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'deepstation')
    .single();

  let orgId: string;

  // Get the first user to assign as owner
  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUserId = users?.users[0]?.id;

  if (!firstUserId) {
    console.error('❌ No users found. Please create a user first.');
    process.exit(1);
  }

  if (existingOrg) {
    console.log('✅ DeepStation organization already exists');
    orgId = existingOrg.id;
  } else {
    // Create organization directly with SQL to avoid trigger issues
    const { data: newOrg, error: orgError } = await supabase.rpc('create_organization_with_owner', {
      org_name: 'DeepStation',
      org_slug: 'deepstation',
      org_description: 'AI-powered platform for events, content creation, and automation',
      org_brand_color: '#6366f1',
      org_website: 'https://deepstation.ai',
      owner_user_id: firstUserId,
    });

    if (orgError) {
      // Fallback: Create without trigger
      console.log('⚠️  RPC not found, using fallback method...');

      const { data: org, error: insertError } = await supabase
        .from('organizations')
        .insert({
          name: 'DeepStation',
          slug: 'deepstation',
          description: 'AI-powered platform for events, content creation, and automation',
          brand_color: '#6366f1',
          website_url: 'https://deepstation.ai',
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Failed to create organization:', insertError);
        process.exit(1);
      }

      orgId = org.id;

      // Manually add owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: firstUserId,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('❌ Failed to add owner:', memberError);
      }
    } else {
      orgId = newOrg;
    }

    console.log('✅ Created DeepStation organization:', orgId);
  }

  // Step 2: Import events
  console.log('\n📅 Importing events...\n');

  const events = [
    {
      title: 'OpenAI Academy x DeepStation: Build a Multi-Agent System',
      slug: 'openai-academy-multi-agent-system',
      description: 'Join us for an interactive workshop where you\'ll learn to build sophisticated multi-agent AI systems. Led by Aniket Maurya, former Lightning AI engineer, this academy session will walk you through designing, implementing, and deploying multi-agent architectures that can solve complex problems through collaboration.',
      short_description: 'Workshop on building multi-agent AI systems with Aniket Maurya (former Lightning AI)',
      event_date: '2025-10-06',
      start_time: '15:00:00',
      end_time: '16:00:00',
      timezone: 'America/New_York',
      location_type: 'online',
      meeting_url: 'https://luma.com/3zr3y8ba',
      virtual_platform: 'Luma',
      event_type: 'workshop',
      status: 'published',
      visibility: 'public',
      allows_guests: true,
      luma_event_url: 'https://luma.com/3zr3y8ba',
      tags: ['AI', 'Multi-Agent Systems', 'Workshop', 'OpenAI'],
    },
    {
      title: 'DeepStation - AI Startup Days',
      slug: 'ai-startup-days-miami',
      description: 'An exclusive evening showcasing the brightest AI startups and innovators. Network with founders, investors, and industry leaders while experiencing demos from cutting-edge AI companies. Features speakers from OutRival (YC) and Gail, plus opportunities to connect with the Miami AI ecosystem.',
      short_description: 'Startup showcase featuring AI innovators, investors, and networking',
      event_date: '2025-10-14',
      start_time: '18:00:00',
      end_time: '21:30:00',
      timezone: 'America/New_York',
      location_type: 'in-person',
      venue_name: 'The LAB Miami',
      venue_address: 'Miami, FL',
      event_type: 'networking',
      status: 'published',
      visibility: 'public',
      allows_guests: true,
      capacity: 150,
      luma_event_url: 'https://luma.com/f9g7g80e',
      tags: ['AI', 'Startups', 'Networking', 'Miami', 'Demo Day'],
    },
    {
      title: 'DeepStation x MSRIT Bangalore - Launch Event',
      slug: 'deepstation-bangalore-launch',
      description: 'Join us for the official launch of DeepStation in Bangalore, India! This inaugural event brings together students, developers, and AI enthusiasts at the prestigious Ramaiah Institute of Technology. Experience talks, workshops, and networking opportunities as we expand our global community.',
      short_description: 'Launch event in Bangalore bringing AI to India',
      event_date: '2025-10-20',
      start_time: '14:00:00',
      end_time: '18:00:00',
      timezone: 'Asia/Kolkata',
      location_type: 'in-person',
      venue_name: 'Ramaiah Institute of Technology',
      venue_address: 'Bangalore, Karnataka, India',
      event_type: 'conference',
      status: 'published',
      visibility: 'public',
      requires_approval: true,
      approval_message: 'This event requires approval. Please tell us why you\'d like to attend.',
      allows_guests: false,
      luma_event_url: 'https://luma.com/or3s9l0h',
      tags: ['AI', 'Launch', 'India', 'Conference', 'Community'],
    },
    {
      title: 'DeepStation MoonMax AI Film Festival',
      slug: 'moonmax-ai-film-festival',
      description: 'The first-ever AI Film Festival celebrating creativity at the intersection of artificial intelligence and cinema. Submit your AI-generated films for a chance to win $10,000 in Raindance Film School grants. Categories include Best Picture, Best Commercial, Best Story, Best Visuals, and more. Join us for screenings, awards, and networking with AI filmmakers.',
      short_description: 'AI Film Festival with $10,000 in prizes and multiple award categories',
      event_date: '2025-11-08',
      start_time: '18:00:00',
      end_time: '22:00:00',
      timezone: 'America/New_York',
      location_type: 'in-person',
      venue_name: 'Miami Film Center',
      venue_address: 'Miami, Florida',
      event_type: 'conference',
      status: 'published',
      visibility: 'public',
      allows_guests: true,
      capacity: 200,
      luma_event_url: 'https://luma.com/t3hjsf1a',
      tags: ['AI', 'Film', 'Festival', 'Awards', 'Miami', 'Art'],
    },
    {
      title: 'Vibe Days - Community Builder Meetup',
      slug: 'vibe-days-community-meetup',
      description: 'Join fellow developers and tech enthusiasts for a day of live coding, workshops, and genuine connection. Vibe Days is all about building together, sharing knowledge, and creating lasting relationships in the tech community. Whether you\'re a beginner or seasoned pro, come vibe with us!',
      short_description: 'Live coding, workshops, and networking for the tech community',
      event_date: '2025-10-25',
      start_time: '10:00:00',
      end_time: '17:00:00',
      timezone: 'America/New_York',
      location_type: 'in-person',
      venue_name: 'Alan B. Levan | NSU Broward Center',
      venue_address: 'Davie, FL',
      event_type: 'meetup',
      status: 'published',
      visibility: 'public',
      requires_approval: true,
      approval_message: 'Help us get to know you! What brings you to Vibe Days?',
      allows_guests: true,
      capacity: 100,
      luma_event_url: 'https://luma.com/z1xcwh12',
      tags: ['Community', 'Coding', 'Workshop', 'Networking', 'Tech'],
    },
  ];

  for (const event of events) {
    console.log(`\n📝 Importing: ${event.title}`);

    // Check if event already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('slug', event.slug)
      .single();

    if (existingEvent) {
      console.log(`   ⏭️  Event already exists, skipping...`);
      continue;
    }

    // Insert event
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        ...event,
        organization_id: orgId,
        user_id: firstUserId,
      })
      .select('id, title')
      .single();

    if (eventError) {
      console.error(`   ❌ Failed to import event:`, eventError);
      continue;
    }

    console.log(`   ✅ Imported successfully (ID: ${newEvent.id})`);
  }

  console.log('\n✨ Import complete!\n');
  console.log('📊 Summary:');
  console.log(`   Organization: DeepStation (${orgId})`);
  console.log(`   Events imported: ${events.length}`);
  console.log('\n🎉 Ready to build the events platform!');
}

main().catch(console.error);
