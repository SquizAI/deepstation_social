import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user AI settings
    const { data, error } = await supabase.rpc('get_or_create_user_ai_settings', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Error fetching AI settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error: any) {
    console.error('Error in AI settings GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update user AI settings
    const { data, error } = await supabase
      .from('user_ai_settings')
      .update(body)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error: any) {
    console.error('Error in AI settings PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
