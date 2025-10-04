'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface WorkflowBuilderModalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export function WorkflowBuilderModal({ children, isOpen }: WorkflowBuilderModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#0a0513]">
      {children}
    </div>,
    document.body
  );
}
