/**
 * Workflow Execution Engine
 * Executes workflows with full observability and cost tracking
 */

import { aiOrchestrator, AIModel, TaskType } from '../ai/orchestrator';
import { imagen4Service } from '../ai/models/imagen4';
import { veo3Service } from '../ai/models/veo3';
import { firecrawlService } from '../ai/firecrawl-service';
import { ClaudeAgentIntegration } from './claude-agent-integration';

export interface WorkflowNode {
  id: string;
  nodeKey: string;
  nodeType: 'trigger' | 'condition' | 'action' | 'ai' | 'transform' | 'delay' | 'loop' | 'branch' | 'claude-agent';
  config: Record<string, any>;
  inputs: Array<{ nodeKey: string; outputKey?: string }>;
  outputs: Array<{ nodeKey: string; inputKey?: string }>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  maxCostPerRun: number;
  timeoutSeconds: number;
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerData: Record<string, any>;
  variables: Map<string, any>;
  totalCost: number;
  startTime: number;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  totalCost: number;
  duration: number;
  nodesExecuted: number;
  nodesFailed: number;
}

/**
 * Workflow Execution Engine
 */
export class WorkflowExecutionEngine {
  private context: ExecutionContext | null = null;
  private claudeAgent: ClaudeAgentIntegration;

  constructor() {
    this.claudeAgent = new ClaudeAgentIntegration();
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    triggerData: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Initialize execution context
    this.context = {
      executionId: `exec_${Date.now()}`,
      workflowId: workflow.id,
      userId: '', // Set by caller
      triggerData,
      variables: new Map(),
      totalCost: 0,
      startTime,
    };

    let nodesExecuted = 0;
    let nodesFailed = 0;
    let lastOutput: any = null;

    try {
      // Find trigger node
      const triggerNode = workflow.nodes.find((n) => n.nodeType === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder(workflow.nodes);

      for (const nodeKey of executionOrder) {
        const node = workflow.nodes.find((n) => n.nodeKey === nodeKey);
        if (!node) continue;

        try {
          console.log(`Executing node: ${node.nodeKey} (${node.nodeType})`);

          const result = await this.executeNode(node);

          // Store result in variables
          this.context.variables.set(node.nodeKey, result);
          lastOutput = result;
          nodesExecuted++;

          // Check cost limit
          if (this.context.totalCost > workflow.maxCostPerRun) {
            throw new Error(
              `Cost limit exceeded: $${this.context.totalCost.toFixed(4)} > $${workflow.maxCostPerRun}`
            );
          }

          // Check timeout
          if (Date.now() - startTime > workflow.timeoutSeconds * 1000) {
            throw new Error('Workflow timeout exceeded');
          }
        } catch (error) {
          nodesFailed++;
          console.error(`Node ${node.nodeKey} failed:`, error);

          if (!workflow.retryOnFailure) {
            throw error;
          }
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: lastOutput,
        totalCost: this.context.totalCost,
        duration,
        nodesExecuted,
        nodesFailed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCost: this.context.totalCost,
        duration,
        nodesExecuted,
        nodesFailed,
      };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(node: WorkflowNode): Promise<any> {
    if (!this.context) {
      throw new Error('Execution context not initialized');
    }

    // Get input data from connected nodes
    const inputs = this.getNodeInputs(node);

    switch (node.nodeType) {
      case 'trigger':
        return this.context.triggerData;

      case 'ai':
        return await this.executeAINode(node, inputs);

      case 'claude-agent':
        return await this.executeClaudeAgentNode(node, inputs);

      case 'action':
        return await this.executeActionNode(node, inputs);

      case 'transform':
        return await this.executeTransformNode(node, inputs);

      case 'condition':
        return await this.executeConditionNode(node, inputs);

      case 'delay':
        return await this.executeDelayNode(node);

      default:
        throw new Error(`Unknown node type: ${node.nodeType}`);
    }
  }

  /**
   * Execute AI node (text/image/video generation)
   */
  private async executeAINode(node: WorkflowNode, inputs: any): Promise<any> {
    const { aiType, model, prompt, config = {} } = node.config;

    // Replace variables in prompt
    const processedPrompt = this.interpolateVariables(prompt, inputs);

    let result;
    let cost = 0;

    switch (aiType) {
      case 'text-generation':
        result = await aiOrchestrator.execute({
          type: TaskType.TEXT_GENERATION,
          input: processedPrompt,
          options: {
            model: model || AIModel.CLAUDE_45_SONNET,
            quality: config.quality || 'balanced',
          },
        });
        cost = result.cost;
        break;

      case 'image-generation':
        const imageResult = await imagen4Service.generateImage({
          prompt: processedPrompt,
          aspectRatio: config.aspectRatio || '1:1',
          numberOfImages: config.numberOfImages || 1,
          stylePreset: config.stylePreset,
        });
        result = { output: imageResult };
        cost = imageResult.cost;
        break;

      case 'video-generation':
        const videoResult = await veo3Service.generateVideo({
          prompt: processedPrompt,
          duration: config.duration || 6,
          resolution: config.resolution || '1080p',
          aspectRatio: config.aspectRatio || '16:9',
          withAudio: config.withAudio !== false,
        });
        result = { output: videoResult };
        cost = videoResult.cost;
        break;

      case 'web-scraping':
        const scrapeResult = await firecrawlService.scrape({
          url: config.url || processedPrompt,
          formats: config.formats || ['markdown'],
          onlyMainContent: true,
        });
        result = { output: scrapeResult };
        cost = 0.001; // Firecrawl cost
        break;

      default:
        throw new Error(`Unknown AI type: ${aiType}`);
    }

    if (this.context) {
      this.context.totalCost += cost;
    }

    return result;
  }

  /**
   * Execute action node (post to social media, save to DB, etc.)
   */
  private async executeActionNode(node: WorkflowNode, inputs: any): Promise<any> {
    const { actionType, config = {} } = node.config;

    switch (actionType) {
      case 'post-to-social':
        // Integrate with social media posting
        return { success: true, platform: config.platform };

      case 'save-to-database':
        // Save data to database
        return { success: true };

      case 'send-email':
        // Send email notification
        return { success: true };

      case 'webhook':
        // Call webhook
        const response = await fetch(config.url, {
          method: config.method || 'POST',
          headers: config.headers || {},
          body: JSON.stringify(inputs),
        });
        return await response.json();

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Execute transform node (data manipulation)
   */
  private async executeTransformNode(node: WorkflowNode, inputs: any): Promise<any> {
    const { transformType, config = {} } = node.config;

    switch (transformType) {
      case 'map':
        // Map over array
        return inputs.map((item: any) => this.interpolateVariables(config.template, item));

      case 'filter':
        // Filter array
        return inputs.filter((item: any) => this.evaluateCondition(config.condition, item));

      case 'merge':
        // Merge objects
        return { ...inputs };

      case 'extract':
        // Extract specific fields
        return config.fields.reduce((acc: any, field: string) => {
          acc[field] = inputs[field];
          return acc;
        }, {});

      default:
        return inputs;
    }
  }

  /**
   * Execute condition node (branching logic)
   */
  private async executeConditionNode(node: WorkflowNode, inputs: any): Promise<boolean> {
    const { condition } = node.config;
    return this.evaluateCondition(condition, inputs);
  }

  /**
   * Execute delay node
   */
  private async executeDelayNode(node: WorkflowNode): Promise<void> {
    const { duration } = node.config;
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  /**
   * Execute Claude Agent node
   */
  private async executeClaudeAgentNode(node: WorkflowNode, inputs: any): Promise<any> {
    const { agentName, operation, config = {} } = node.config;

    if (!agentName) {
      throw new Error('agentName is required for claude-agent node');
    }

    if (!operation) {
      throw new Error('operation is required for claude-agent node');
    }

    // Merge node config with inputs for agent execution
    const agentInputs = {
      ...inputs,
      ...config,
    };

    // Interpolate variables in string inputs
    const processedInputs: Record<string, any> = {};
    for (const [key, value] of Object.entries(agentInputs)) {
      if (typeof value === 'string') {
        processedInputs[key] = this.interpolateVariables(value, inputs);
      } else {
        processedInputs[key] = value;
      }
    }

    // Execute the agent
    const result = await this.claudeAgent.executeAgent(
      agentName,
      operation,
      processedInputs
    );

    // Track cost
    if (this.context && result.success) {
      this.context.totalCost += result.cost;
    }

    // Throw error if agent failed
    if (!result.success) {
      throw new Error(`Agent ${agentName} failed: ${result.error}`);
    }

    return result.output;
  }

  /**
   * Get inputs for a node from connected nodes
   */
  private getNodeInputs(node: WorkflowNode): any {
    if (!this.context || !node.inputs || node.inputs.length === 0) {
      return {};
    }

    const inputs: Record<string, any> = {};

    for (const input of node.inputs) {
      const value = this.context.variables.get(input.nodeKey);
      if (value !== undefined) {
        if (input.outputKey) {
          inputs[input.outputKey] = value;
        } else {
          Object.assign(inputs, value);
        }
      }
    }

    return inputs;
  }

  /**
   * Get execution order using topological sort
   */
  private getExecutionOrder(nodes: WorkflowNode[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeKey: string) => {
      if (visited.has(nodeKey)) return;
      visited.add(nodeKey);

      const node = nodes.find((n) => n.nodeKey === nodeKey);
      if (!node) return;

      // Visit dependencies first
      for (const input of node.inputs || []) {
        visit(input.nodeKey);
      }

      order.push(nodeKey);
    };

    // Start with trigger nodes
    const triggerNodes = nodes.filter((n) => n.nodeType === 'trigger');
    for (const trigger of triggerNodes) {
      visit(trigger.nodeKey);
    }

    return order;
  }

  /**
   * Interpolate variables in a string
   */
  private interpolateVariables(template: string, data: any): string {
    if (!template) return '';

    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] ?? match;
    });
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: string, data: any): boolean {
    // Simple condition evaluation
    // In production, use a proper expression evaluator
    try {
      const func = new Function('data', `return ${condition}`);
      return func(data);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowExecutionEngine();
