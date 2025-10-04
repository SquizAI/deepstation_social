import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowTemplate } from '@/lib/workflows/templates';

export async function GET(
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
          .eq('workflow_id', id)
          .order('order_index', { ascending: true });

        return NextResponse.json({
          workflow: {
            ...workflow,
            nodes: nodes || [],
          },
        });
      }
    } catch (dbError) {
      console.log('Database not available, using workflow template');
    }

    // Fallback: Use workflow template
    const template = getWorkflowTemplate(id);

    if (!template) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({
      workflow: {
        id: template.id,
        name: template.name,
        description: `Pre-built template with ${template.nodes.length} nodes`,
        status: 'template',
        trigger_type: 'manual',
        max_cost_per_run: template.maxCostPerRun,
        timeout_seconds: template.timeoutSeconds,
        nodes: template.nodes,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description, nodes, max_cost_per_run, timeout_seconds } = body;

    // Update workflow
    try {
      const { data: workflow, error } = await supabase
        .from('workflows')
        .update({
          ...(name && { name }),
          ...(description && { description }),
          ...(max_cost_per_run !== undefined && { max_cost_per_run }),
          ...(timeout_seconds !== undefined && { timeout_seconds }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update nodes if provided
      if (nodes && Array.isArray(nodes)) {
        // Delete existing nodes
        await supabase
          .from('workflow_nodes')
          .delete()
          .eq('workflow_id', id);

        // Insert new nodes
        if (nodes.length > 0) {
          const nodesToInsert = nodes.map((node: any, index: number) => ({
            workflow_id: id,
            node_key: node.nodeKey || node.node_key,
            node_type: node.nodeType || node.node_type,
            config: node.config,
            position_x: node.position_x || 0,
            position_y: node.position_y || 0,
            order_index: node.order_index !== undefined ? node.order_index : index,
          }));

          await supabase
            .from('workflow_nodes')
            .insert(nodesToInsert);
        }
      }

      return NextResponse.json({ workflow });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    try {
      // Delete workflow nodes first
      await supabase
        .from('workflow_nodes')
        .delete()
        .eq('workflow_id', id);

      // Delete workflow
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
