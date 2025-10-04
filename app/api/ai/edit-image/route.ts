import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { imagen4Service } from '@/lib/ai/models/imagen4';
import { geminiImageService } from '@/lib/ai/models/gemini-image';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      imageUrl,
      prompt,
      model = 'gemini-2.5-flash-image', // Gemini is better for editing
      editType = 'enhance', // 'background' | 'object' | 'style' | 'enhance'
      mask,
    } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      );
    }

    let result;

    if (model === 'imagen-4') {
      result = await imagen4Service.editImage({
        imageUrl,
        prompt,
        mask,
        editMode: editType === 'background' ? 'inpaint' : 'edit',
      });
    } else if (model === 'gemini-2.5-flash-image') {
      result = await geminiImageService.editImage({
        imageUrl,
        editPrompt: prompt,
        editType,
      });
    } else {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    // Save to database
    const { data: savedGeneration } = await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        type: 'image',
        model,
        prompt,
        output_url: result.images[0]?.url,
        output_data: result.images[0],
        config: {
          editType,
          originalImageUrl: imageUrl,
        },
        cost: result.cost,
        generation_time_ms: result.generationTime,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      image: result.images[0],
      cost: result.cost,
      generationTime: result.generationTime,
      generation: savedGeneration,
    });
  } catch (error) {
    console.error('Image edit error:', error);
    return NextResponse.json(
      {
        error: 'Failed to edit image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
