'use client';

import { useState, useCallback, useEffect } from 'react';
import { Node } from 'reactflow';

export interface VariableSuggestion {
  value: string;
  label: string;
  description: string;
  example: string;
  category: 'trigger' | 'node' | 'env';
}

interface UseVariableAutocompleteProps {
  nodes: Node[];
  currentNodeId: string;
}

export function useVariableAutocomplete({ nodes, currentNodeId }: UseVariableAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<VariableSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [filterQuery, setFilterQuery] = useState('');

  // Build variable suggestions from previous nodes
  const buildSuggestions = useCallback(() => {
    const vars: VariableSuggestion[] = [];

    // Find the current node's position in the workflow
    const currentNodeIndex = nodes.findIndex(n => n.id === currentNodeId);

    // Add variables from previous nodes (only nodes before current in the flow)
    nodes.forEach((node, index) => {
      if (index >= currentNodeIndex) return; // Skip current and future nodes

      const nodeKey = node.data.nodeKey;
      const nodeType = node.data.nodeType;

      // Add node-specific variables based on type
      switch (nodeType) {
        case 'trigger':
          vars.push({
            value: `{{${nodeKey}.data}}`,
            label: `${nodeKey}.data`,
            description: 'Input data from trigger',
            example: 'Any data passed to the trigger',
            category: 'trigger',
          });
          vars.push({
            value: `{{${nodeKey}.timestamp}}`,
            label: `${nodeKey}.timestamp`,
            description: 'Trigger execution time',
            example: '2024-01-15T10:30:00Z',
            category: 'trigger',
          });
          break;

        case 'ai':
          const aiType = node.data.config?.aiType;
          if (aiType === 'text-generation') {
            vars.push({
              value: `{{${nodeKey}.output}}`,
              label: `${nodeKey}.output`,
              description: 'Generated text content',
              example: 'AI-generated post content',
              category: 'node',
            });
          } else if (aiType === 'image-generation') {
            vars.push({
              value: `{{${nodeKey}.imageUrl}}`,
              label: `${nodeKey}.imageUrl`,
              description: 'Generated image URL',
              example: 'https://cdn.example.com/image.jpg',
              category: 'node',
            });
          } else if (aiType === 'video-generation') {
            vars.push({
              value: `{{${nodeKey}.videoUrl}}`,
              label: `${nodeKey}.videoUrl`,
              description: 'Generated video URL',
              example: 'https://cdn.example.com/video.mp4',
              category: 'node',
            });
          }
          break;

        case 'claude-agent':
          vars.push({
            value: `{{${nodeKey}.output}}`,
            label: `${nodeKey}.output`,
            description: 'Agent processed content',
            example: 'Optimized social media post',
            category: 'node',
          });
          vars.push({
            value: `{{${nodeKey}.metadata}}`,
            label: `${nodeKey}.metadata`,
            description: 'Agent metadata (tokens, cost, etc.)',
            example: '{"tokens": 150, "cost": 0.003}',
            category: 'node',
          });
          break;

        case 'transform':
          vars.push({
            value: `{{${nodeKey}.result}}`,
            label: `${nodeKey}.result`,
            description: 'Transformed data output',
            example: 'Processed and transformed data',
            category: 'node',
          });
          break;

        case 'condition':
          vars.push({
            value: `{{${nodeKey}.matched}}`,
            label: `${nodeKey}.matched`,
            description: 'Whether condition was true',
            example: 'true or false',
            category: 'node',
          });
          break;

        default:
          vars.push({
            value: `{{${nodeKey}.output}}`,
            label: `${nodeKey}.output`,
            description: 'Node output data',
            example: 'Output from this node',
            category: 'node',
          });
      }
    });

    // Add environment variables
    vars.push(
      {
        value: '{{env.API_KEY}}',
        label: 'env.API_KEY',
        description: 'API key from environment',
        example: 'sk-abc123...',
        category: 'env',
      },
      {
        value: '{{env.WEBHOOK_URL}}',
        label: 'env.WEBHOOK_URL',
        description: 'Webhook URL from environment',
        example: 'https://hooks.example.com/...',
        category: 'env',
      },
      {
        value: '{{env.USER_ID}}',
        label: 'env.USER_ID',
        description: 'Current user ID',
        example: 'user_abc123',
        category: 'env',
      }
    );

    setSuggestions(vars);
  }, [nodes, currentNodeId]);

  useEffect(() => {
    buildSuggestions();
  }, [buildSuggestions]);

  // Handle text input changes
  const handleInputChange = useCallback(
    (value: string, selectionStart: number, inputElement: HTMLElement) => {
      // Check if we're typing inside {{}}
      const beforeCursor = value.substring(0, selectionStart);
      const lastOpenBrace = beforeCursor.lastIndexOf('{{');
      const lastCloseBrace = beforeCursor.lastIndexOf('}}');

      // If {{ is more recent than }}, we're inside a variable
      if (lastOpenBrace > lastCloseBrace && lastOpenBrace !== -1) {
        const query = beforeCursor.substring(lastOpenBrace + 2);
        setFilterQuery(query);
        setShowSuggestions(true);

        // Calculate cursor position for dropdown
        const rect = inputElement.getBoundingClientRect();
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.font = window.getComputedStyle(inputElement).font;
        tempSpan.textContent = beforeCursor;
        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        setCursorPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX + Math.min(textWidth, rect.width - 200),
        });
      } else {
        setShowSuggestions(false);
        setFilterQuery('');
      }
    },
    []
  );

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(s =>
    s.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Insert variable at cursor
  const insertVariable = useCallback(
    (
      suggestion: VariableSuggestion,
      inputValue: string,
      selectionStart: number,
      onChange: (value: string) => void
    ) => {
      const beforeCursor = inputValue.substring(0, selectionStart);
      const afterCursor = inputValue.substring(selectionStart);
      const lastOpenBrace = beforeCursor.lastIndexOf('{{');

      const newValue =
        inputValue.substring(0, lastOpenBrace) +
        suggestion.value +
        afterCursor;

      onChange(newValue);
      setShowSuggestions(false);
      setFilterQuery('');
    },
    []
  );

  return {
    suggestions: filteredSuggestions,
    showSuggestions,
    cursorPosition,
    handleInputChange,
    insertVariable,
    closeSuggestions: () => setShowSuggestions(false),
  };
}
