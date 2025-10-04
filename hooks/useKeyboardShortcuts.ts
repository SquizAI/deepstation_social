'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onDelete?: (nodeId: string | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onShowHelp?: () => void;
  onEscape?: () => void;
  onRunWorkflow?: () => void;
  selectedNodeId: string | null;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onShowHelp,
  onEscape,
  onRunWorkflow,
  selectedNodeId,
  enabled = true,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Command/Ctrl key combinations
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + S: Save
      if (modKey && event.key === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (modKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
      if ((modKey && event.key === 'y') || (modKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        onRedo?.();
        return;
      }

      // Ctrl/Cmd + Enter: Run workflow
      if (modKey && event.key === 'Enter') {
        event.preventDefault();
        onRunWorkflow?.();
        return;
      }

      // Only allow these shortcuts when NOT in input fields
      if (!isInputField) {
        // Delete or Backspace: Delete selected node
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          if (selectedNodeId) {
            onDelete?.(selectedNodeId);
          }
          return;
        }

        // ?: Show help
        if (event.key === '?' && !event.shiftKey) {
          event.preventDefault();
          onShowHelp?.();
          return;
        }

        // Escape: Close panels
        if (event.key === 'Escape') {
          event.preventDefault();
          onEscape?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    selectedNodeId,
    onDelete,
    onUndo,
    onRedo,
    onSave,
    onShowHelp,
    onEscape,
    onRunWorkflow,
  ]);
}
