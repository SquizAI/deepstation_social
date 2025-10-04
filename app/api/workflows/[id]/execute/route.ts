import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { workflowEngine } from '@/lib/workflows/execution-engine';
import { getWorkflowTemplate } from '@/lib/workflows/templates';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inputs = {} } = body;

    let workflowDefinition;
    let executionId = `exec_${Date.now()}`;

    // Try to get workflow from database first
    try {
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!workflowError && workflow) {
        // Get workflow nodes
        const { data: nodes } = await supabase
          .from('workflow_nodes')
          .select('*')
          .eq('workflow_id', id);

        workflowDefinition = {
          id: workflow.id,
          name: workflow.name,
          nodes: nodes || [],
          maxCostPerRun: workflow.max_cost_per_run,
          timeoutSeconds: workflow.timeout_seconds,
          retryOnFailure: workflow.retry_on_failure,
          maxRetries: workflow.max_retries,
        };

        // Create execution record
        const { data: execution } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: id,
            user_id: user.id,
            trigger_type: workflow.trigger_type,
            trigger_data: inputs,
            status: 'running',
          })
          .select()
          .single();

        if (execution) {
          executionId = execution.id;
        }
      }
    } catch (dbError) {
      console.log('Database not available, using workflow template');
    }

    // Fallback: Use workflow template
    if (!workflowDefinition) {
      const template = getWorkflowTemplate(id);

      if (!template) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      workflowDefinition = template;
    }

    // Execute workflow
    const result = await workflowEngine.execute(workflowDefinition, inputs);

    // Try to update execution record (if database is available)
    try {
      await supabase
        .from('workflow_executions')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          output: result.output,
          error: result.error,
          total_cost: result.totalCost,
          nodes_executed: result.nodesExecuted,
          nodes_failed: result.nodesFailed,
        })
        .eq('id', executionId);

      await supabase
        .from('workflows')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', id);
    } catch (dbError) {
      // Ignore database errors
    }

    return NextResponse.json({
      executionId,
      ...result,
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
