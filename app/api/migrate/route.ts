import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '008_event_platform.sql'
    )
    const migrationSQL = await readFile(migrationPath, 'utf-8')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Migration 008_event_platform.sql executed successfully',
      data,
    })
  } catch (error: any) {
    console.error('Migration execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute migration' },
      { status: 500 }
    )
  }
}
