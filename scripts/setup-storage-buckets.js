#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 * Creates storage buckets using the Supabase client library
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

async function createBucket(bucketId, bucketName, options = {}) {
  console.log(`Creating bucket: ${bucketName}...`)

  try {
    const { data, error } = await supabase.storage.createBucket(bucketId, {
      public: options.public !== undefined ? options.public : true,
      fileSizeLimit: options.fileSizeLimit || 5242880, // 5MB default
      allowedMimeTypes: options.allowedMimeTypes || ['image/jpeg', 'image/png', 'image/webp']
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⏭️  ${bucketName} - Already exists, skipping`)
        return true
      }
      console.error(`   ❌ ${bucketName} - Error:`, error.message)
      return false
    }

    console.log(`   ✅ ${bucketName} created successfully`)
    return true
  } catch (err) {
    console.error(`   ❌ ${bucketName} - Exception:`, err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Setting up storage buckets...\n')

  const buckets = [
    {
      id: 'post-images',
      name: 'post-images',
      options: {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    },
    {
      id: 'speaker-photos',
      name: 'speaker-photos',
      options: {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    },
    {
      id: 'speaker-images',
      name: 'speaker-images',
      options: {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    }
  ]

  for (const bucket of buckets) {
    const success = await createBucket(bucket.id, bucket.name, bucket.options)
    if (!success && !bucket.optional) {
      console.error('\n❌ Failed to create required bucket:', bucket.name)
      process.exit(1)
    }
  }

  console.log('\n✅ All storage buckets setup completed!')
  console.log('\n📋 Note: Storage policies will be configured automatically by Supabase RLS.')
  console.log('   You may need to configure custom policies in the Supabase Dashboard if needed.')
}

main().catch(err => {
  console.error('\n❌ Storage setup failed:', err.message)
  process.exit(1)
})
