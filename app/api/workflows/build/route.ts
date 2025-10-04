import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversational Workflow Builder API
 * Uses Claude to understand user intent and generate workflow definitions
 */
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
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build conversation history for Claude
    const messages: Anthropic.MessageParam[] = conversationHistory
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    messages.push({
      role: 'user',
      content: message,
    });

    // System prompt for workflow builder
    const systemPrompt = `You are a workflow builder assistant for DeepStation, an AI-powered social media automation platform.

Your job is to help users create custom workflows by understanding their needs and generating workflow definitions.

Available node types:
1. trigger - Starts the workflow (manual, scheduled, webhook)
2. claude-agent - Uses specialized AI agents:
   - content-optimizer: Optimizes content for different platforms
   - image-workflow-agent: Generates images with AI
   - video-content-agent: Creates videos with Veo 3
   - analytics-agent: Analyzes post performance
3. ai - Generic AI operations (summarize, translate, generate)
4. action - Posts to platforms (LinkedIn, Instagram, X, Discord)
5. condition - Branching logic based on conditions
6. transform - Data transformation and formatting
7. delay - Wait for a specific time
8. loop - Iterate over arrays

When a user describes what they want:
1. Ask clarifying questions if needed (platforms, triggers, specific requirements)
2. Once you have enough info, generate a workflow definition
3. Explain what the workflow will do in simple terms

Workflow Definition Format:
{
  "id": "unique-workflow-id",
  "name": "Workflow Name",
  "description": "What this workflow does",
  "maxCostPerRun": 0.50,
  "timeoutSeconds": 300,
  "retryOnFailure": true,
  "maxRetries": 2,
  "nodes": [
    {
      "id": "1",
      "nodeKey": "trigger",
      "nodeType": "trigger",
      "config": {
        "triggerType": "manual"
      }
    },
    {
      "id": "2",
      "nodeKey": "optimize_content",
      "nodeType": "claude-agent",
      "config": {
        "agentName": "content-optimizer",
        "operation": "optimize-single",
        "content": "{{trigger.content}}",
        "platform": "linkedin"
      }
    }
  ]
}

When generating a workflow:
- Start with a trigger node
- Use claude-agent nodes for AI operations
- Use action nodes to post content
- Keep it simple but powerful
- Always include cost estimates

If you're generating a workflow, wrap it in a JSON code block like this:
\`\`\`json
{workflow definition here}
\`\`\`

Be conversational, helpful, and guide users to create effective workflows.`;

    console.log('🤖 Calling Claude for workflow building...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    console.log('✅ Claude response received');

    // Check if workflow definition was generated
    let workflowDefinition = null;
    const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch) {
      try {
        workflowDefinition = JSON.parse(jsonMatch[1]);
        console.log('📊 Workflow definition generated:', workflowDefinition.name);

        // Save to database if available
        try {
          const { data: workflow, error } = await supabase
            .from('workflows')
            .insert({
              user_id: user.id,
              name: workflowDefinition.name,
              description: workflowDefinition.description,
              trigger_type: workflowDefinition.nodes[0]?.config?.triggerType || 'manual',
              max_cost_per_run: workflowDefinition.maxCostPerRun,
              timeout_seconds: workflowDefinition.timeoutSeconds,
              retry_on_failure: workflowDefinition.retryOnFailure,
              max_retries: workflowDefinition.maxRetries,
              status: 'draft',
            })
            .select()
            .single();

          if (!error && workflow) {
            // Save nodes
            const nodesToInsert = workflowDefinition.nodes.map((node: any, index: number) => ({
              workflow_id: workflow.id,
              node_key: node.nodeKey,
              node_type: node.nodeType,
              config: node.config,
              position_x: index * 250,
              position_y: 100,
              order_index: index,
            }));

            await supabase.from('workflow_nodes').insert(nodesToInsert);

            workflowDefinition.id = workflow.id;
            console.log('💾 Workflow saved to database:', workflow.id);
          }
        } catch (dbError) {
          console.log('⚠️ Database not available, workflow not saved');
          // Use temporary ID
          workflowDefinition.id = `temp_${Date.now()}`;
        }
      } catch (parseError) {
        console.error('Failed to parse workflow JSON:', parseError);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      workflow: workflowDefinition,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      cost: calculateCost(response.usage.input_tokens, response.usage.output_tokens),
    });
  } catch (error) {
    console.error('Workflow builder error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet 4.5 pricing (as of 2025)
  const inputCostPer1M = 3.0; // $3 per million input tokens
  const outputCostPer1M = 15.0; // $15 per million output tokens

  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;

  return inputCost + outputCost;
}
