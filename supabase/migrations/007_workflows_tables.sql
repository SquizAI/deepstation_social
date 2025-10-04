-- Workflows System for DeepStation
-- Visual workflow builder with autonomous execution

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  -- Workflow configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
  trigger_config JSONB DEFAULT '{}'::jsonb,

  -- Execution settings
  retry_on_failure BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,

  -- Cost management
  max_cost_per_run DECIMAL(10, 4) DEFAULT 1.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  version INTEGER DEFAULT 1
);

-- Workflow nodes (steps in the workflow)
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Node identification
  node_key TEXT NOT NULL, -- Unique within workflow
  node_type TEXT NOT NULL CHECK (node_type IN (
    'trigger', 'condition', 'action', 'ai', 'transform', 'delay', 'loop', 'branch'
  )),

  -- Node configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Visual positioning
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,

  -- Connections
  inputs JSONB DEFAULT '[]'::jsonb, -- Array of {nodeKey, outputKey}
  outputs JSONB DEFAULT '[]'::jsonb, -- Array of {nodeKey, inputKey}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workflow_id, node_key)
);

-- Workflow executions (runs)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Execution status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'
  )),

  -- Trigger information
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Execution timeline
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  output JSONB,
  error TEXT,

  -- Resource usage
  total_cost DECIMAL(10, 4) DEFAULT 0.00,
  nodes_executed INTEGER DEFAULT 0,
  nodes_failed INTEGER DEFAULT 0,

  -- Retry information
  retry_count INTEGER DEFAULT 0,
  parent_execution_id UUID REFERENCES workflow_executions(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow node execution logs
CREATE TABLE IF NOT EXISTS workflow_node_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,

  -- Execution details
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Input/Output
  input JSONB,
  output JSONB,
  error TEXT,

  -- AI model information (if applicable)
  ai_model TEXT,
  ai_cost DECIMAL(10, 4) DEFAULT 0.00,
  ai_tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow templates (pre-built workflows users can copy)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'content-creation', 'social-media', 'analytics', 'automation', 'ai-agents'
  )),

  -- Template configuration
  template_data JSONB NOT NULL, -- Full workflow definition
  preview_image TEXT,

  -- Popularity
  use_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Creator
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- AI generation history (for image/video/text generation)
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES workflow_executions(id),

  -- Generation type
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio')),
  model TEXT NOT NULL, -- e.g., 'gpt-5', 'imagen-4', 'veo-3'

  -- Input/Output
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  output_url TEXT,
  output_data JSONB,

  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,

  -- Metrics
  cost DECIMAL(10, 4) NOT NULL,
  generation_time_ms INTEGER,
  quality_score DECIMAL(3, 2), -- 0-10 rating

  -- Feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,

  -- Safety
  safety_ratings JSONB DEFAULT '{}'::jsonb,
  flagged BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_node_logs_execution_id ON workflow_node_logs(execution_id);
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_type ON ai_generations(type);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_is_public ON workflow_templates(is_public) WHERE is_public = true;

-- RLS Policies

-- Workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflows"
  ON workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Workflow nodes
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nodes of their workflows"
  ON workflow_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage nodes of their workflows"
  ON workflow_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Workflow executions
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workflow executions"
  ON workflow_executions FOR SELECT
  USING (auth.uid() = user_id);

-- Workflow node logs
ALTER TABLE workflow_node_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their executions"
  ON workflow_node_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE workflow_executions.id = workflow_node_logs.execution_id
      AND workflow_executions.user_id = auth.uid()
    )
  );

-- Workflow templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
  ON workflow_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON workflow_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON workflow_templates FOR UPDATE
  USING (auth.uid() = created_by);

-- AI generations
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their AI generations"
  ON ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generations"
  ON ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Update workflow updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER workflow_nodes_updated_at
  BEFORE UPDATE ON workflow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- Calculate execution duration
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_executions_duration
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_duration();

CREATE TRIGGER workflow_node_logs_duration
  BEFORE UPDATE ON workflow_node_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_duration();
