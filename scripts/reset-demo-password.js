#!/usr/bin/env node

/**
 * Reset Demo User Password
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

const DEMO_EMAIL = 'demo@deepstation.ai'
const DEMO_PASSWORD = 'DeepStation2025!'

async function resetPassword() {
  console.log('🔄 Resetting demo user password...\n')

  try {
    // Get user by email
    const { data: users } = await supabase.auth.admin.listUsers()
    const demoUser = users?.users?.find(u => u.email === DEMO_EMAIL)

    if (!demoUser) {
      console.error('❌ Demo user not found')
      process.exit(1)
    }

    console.log(`   Found user: ${demoUser.id}`)

    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      {
        password: DEMO_PASSWORD,
        email_confirm: true
      }
    )

    if (error) {
      console.error('❌ Error updating password:', error.message)
      process.exit(1)
    }

    console.log('   ✅ Password reset successfully')
    console.log('\n📋 Demo User Credentials:')
    console.log(`   Email: ${DEMO_EMAIL}`)
    console.log(`   Password: ${DEMO_PASSWORD}\n`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetPassword()
