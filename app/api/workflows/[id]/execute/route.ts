import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { workflowEngine } from '@/lib/workflows/execution-engine';

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

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get workflow nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', id);

    if (nodesError) {
      throw nodesError;
    }

    const body = await request.json();
    const { triggerData = {} } = body;

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: id,
        user_id: user.id,
        trigger_type: workflow.trigger_type,
        trigger_data: triggerData,
        status: 'running',
      })
      .select()
      .single();

    if (executionError) {
      throw executionError;
    }

    // Execute workflow
    const result = await workflowEngine.execute(
      {
        id: workflow.id,
        name: workflow.name,
        nodes: nodes || [],
        maxCostPerRun: workflow.max_cost_per_run,
        timeoutSeconds: workflow.timeout_seconds,
        retryOnFailure: workflow.retry_on_failure,
        maxRetries: workflow.max_retries,
      },
      triggerData
    );

    // Update execution record
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
      .eq('id', execution.id);

    // Update workflow last_run_at
    await supabase
      .from('workflows')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({
      executionId: execution.id,
      result,
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
