import { NextRequest, NextResponse } from 'next/server';
import { workflowEngine } from '@/lib/workflows/execution-engine';
import { MULTI_PLATFORM_OPTIMIZATION_WORKFLOW } from '@/lib/workflows/templates';

/**
 * Test endpoint for Claude Agent SDK integration
 * Tests the multi-platform optimization workflow
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Claude Agent SDK Integration...');

    // Test workflow execution with real data
    const result = await workflowEngine.execute(
      MULTI_PLATFORM_OPTIMIZATION_WORKFLOW,
      {
        baseContent: 'Excited to announce that we just shipped a major update to DeepStation! Our new AI-powered workflow automation makes social media management 10x easier.',
        platforms: ['linkedin', 'instagram', 'twitter'],
        includeHashtags: true,
        tone: 'professional',
      }
    );

    console.log('✅ Workflow execution result:', {
      success: result.success,
      cost: result.totalCost,
      duration: result.duration,
      nodesExecuted: result.nodesExecuted,
      nodesFailed: result.nodesFailed,
    });

    if (!result.success) {
      console.error('❌ Workflow failed:', result.error);
    } else {
      console.log('📊 Output:', JSON.stringify(result.output, null, 2));
    }

    return NextResponse.json({
      success: result.success,
      output: result.output,
      cost: result.totalCost,
      duration: result.duration,
      nodesExecuted: result.nodesExecuted,
      nodesFailed: result.nodesFailed,
      error: result.error,
    });
  } catch (error) {
    console.error('💥 Test failed with exception:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
