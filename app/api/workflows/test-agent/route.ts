import { NextRequest, NextResponse } from 'next/server';
import { ClaudeAgentIntegration } from '@/lib/workflows/claude-agent-integration';

/**
 * Direct test of Claude Agent integration (no workflow)
 * Tests if the agent can be invoked directly
 */
export async function GET(request: NextRequest) {
  try {
    const claudeAgent = new ClaudeAgentIntegration();

    // Check if ANTHROPIC_API_KEY is available
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    console.log('🔑 ANTHROPIC_API_KEY available:', hasApiKey);

    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not set in environment',
        message: 'Integration layer works, but cannot call Claude API without key',
        availableAgents: claudeAgent.getAvailableAgents().map(a => ({
          name: a.name,
          description: a.description,
          model: a.model,
        })),
      });
    }

    // Test actual agent execution (only if API key is available)
    console.log('🧪 Testing content-optimizer agent...');

    const result = await claudeAgent.executeAgent(
      'content-optimizer',
      'optimize-single',
      {
        content: 'Just shipped a major update!',
        platform: 'linkedin',
        includeHashtags: true,
      }
    );

    console.log('✅ Agent execution result:', {
      success: result.success,
      cost: result.cost,
      tokens: result.tokens,
      hasOutput: !!result.output,
    });

    return NextResponse.json({
      success: result.success,
      output: result.output,
      cost: result.cost,
      tokens: result.tokens,
      model: result.model,
      error: result.error,
    });
  } catch (error) {
    console.error('💥 Agent test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
