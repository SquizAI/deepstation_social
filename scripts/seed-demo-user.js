#!/usr/bin/env node

/**
 * Seed Demo User
 * Creates a demo user account and sample data for testing
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xhohhxoowqlldbdcpynj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2hoeG9vd3FsbGRiZGNweW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTY4OSwiZXhwIjoyMDc1MTc1Njg5fQ.SNp0GFvhTQ-5RlZs8ZFpSrusiUFGxROe1AoOfPSVTok'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Demo user credentials
const DEMO_USER = {
  email: 'demo@deepstation.ai',
  password: 'DeepStation2025!',
  fullName: 'Demo User'
}

async function createDemoUser() {
  console.log('🚀 Creating demo user...\n')

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.some(u => u.email === DEMO_USER.email)

    let userId

    if (userExists) {
      console.log('   ⏭️  Demo user already exists')
      const user = existingUser.users.find(u => u.email === DEMO_USER.email)
      userId = user.id
    } else {
      // Create demo user
      const { data, error } = await supabase.auth.admin.createUser({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_USER.fullName
        }
      })

      if (error) {
        console.error('   ❌ Error creating demo user:', error.message)
        return null
      }

      userId = data.user.id
      console.log('   ✅ Demo user created')
    }

    console.log('\n📋 Demo User Credentials:')
    console.log(`   Email: ${DEMO_USER.email}`)
    console.log(`   Password: ${DEMO_USER.password}`)
    console.log(`   User ID: ${userId}\n`)

    return userId
  } catch (error) {
    console.error('   ❌ Error:', error.message)
    return null
  }
}

async function seedSampleData(userId) {
  console.log('📦 Seeding sample data...\n')

  try {
    // Sample scheduled post
    const samplePost = {
      user_id: userId,
      content: 'Excited to announce our next AI workshop! Join us to learn about the latest developments in GPT-5, Gemini 2.5 Pro, and Claude Sonnet 4.5. 🚀\n\n#AI #MachineLearning #DeepStation',
      platforms: ['linkedin', 'twitter'],
      scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .insert(samplePost)
      .select()
      .single()

    if (postError) {
      console.log('   ⚠️  Could not create sample post:', postError.message)
    } else {
      console.log('   ✅ Sample scheduled post created')
    }

    // Sample speaker
    const sampleSpeaker = {
      user_id: userId,
      full_name: 'Dr. Sarah Chen',
      title: 'AI Research Lead',
      company: 'OpenAI',
      bio: 'Leading researcher in large language models and AI safety. Previously at Google Brain and MIT.',
      presentation_title: 'The Future of Multimodal AI',
      presentation_description: 'Exploring how AI systems are evolving to understand and generate content across text, images, and video.',
      presentation_type: 'presentation',
      expertise: ['AI', 'Machine Learning', 'NLP', 'Computer Vision'],
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      event_location: 'Miami',
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: '@sarahchen_ai',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .insert(sampleSpeaker)
      .select()
      .single()

    if (speakerError) {
      console.log('   ⚠️  Could not create sample speaker:', speakerError.message)
    } else {
      console.log('   ✅ Sample speaker created')
    }

    // Sample analytics data (if post was created)
    if (post) {
      const sampleAnalytics = {
        post_id: post.id,
        platform: 'linkedin',
        views: 1250,
        likes: 89,
        comments: 12,
        shares: 7,
        engagement_rate: 8.64,
        recorded_at: new Date().toISOString()
      }

      const { error: analyticsError } = await supabase
        .from('post_results')
        .insert(sampleAnalytics)

      if (analyticsError) {
        console.log('   ⚠️  Could not create sample analytics:', analyticsError.message)
      } else {
        console.log('   ✅ Sample analytics data created')
      }
    }

    console.log('\n✅ All sample data seeded successfully!')
  } catch (error) {
    console.error('   ❌ Error seeding data:', error.message)
  }
}

async function main() {
  const userId = await createDemoUser()

  if (userId) {
    await seedSampleData(userId)
    console.log('\n🎉 Demo user setup complete!')
    console.log('\n💡 You can now log in with:')
    console.log(`   Email: ${DEMO_USER.email}`)
    console.log(`   Password: ${DEMO_USER.password}\n`)
  } else {
    console.error('\n❌ Failed to create demo user')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ Script failed:', err.message)
  process.exit(1)
})
