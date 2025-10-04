import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  action: string;
}

export function useWorkflowHistory(maxHistorySize = 50) {
  const [history, setHistory] = useState<WorkflowState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushState = useCallback((nodes: Node[], edges: Edge[], action: string) => {
    setHistory((prev) => {
      // Remove any future states if we're not at the end (user made changes after undoing)
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new state
      newHistory.push({
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(edges)), // Deep clone
        timestamp: Date.now(),
        action,
      });

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift(); // Remove oldest state
        setCurrentIndex(maxHistorySize - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }

      return newHistory;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Get the action name for the undo/redo operation
  const getUndoActionName = () => {
    if (currentIndex > 0) {
      return history[currentIndex]?.action || 'action';
    }
    return '';
  };

  const getRedoActionName = () => {
    if (currentIndex < history.length - 1) {
      return history[currentIndex + 1]?.action || 'action';
    }
    return '';
  };

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoActionName,
    getRedoActionName,
  };
}
