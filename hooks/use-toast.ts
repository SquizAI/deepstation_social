import { useState, useCallback } from 'react'

export interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = props.duration || 5000

    setToasts(prev => [...prev, { ...props, id }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toast, toasts, dismiss }
}
