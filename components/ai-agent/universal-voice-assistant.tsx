'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ContinuousVoiceAssistant } from './continuous-voice-assistant'

interface UniversalVoiceAssistantProps {
  // Optional: can be controlled externally
  forceFormType?: 'event' | 'post' | 'speaker' | 'generic'
}

interface FieldCache {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  name: string
  selector: string
}

interface FieldSchema {
  name: string
  type: string
  label: string
  required: boolean
  placeholder?: string
}

export function UniversalVoiceAssistant({ forceFormType }: UniversalVoiceAssistantProps) {
  const [isActive, setIsActive] = useState(false)
  const [hasForm, setHasForm] = useState(false)
  const [formType, setFormType] = useState<'event' | 'post' | 'speaker' | 'generic'>('generic')
  const [fieldSchema, setFieldSchema] = useState<FieldSchema[]>([])
  const pathname = usePathname()

  // Performance optimization: cache field lookups
  const fieldCacheRef = useRef<Map<string, FieldCache>>(new Map())
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const activeHighlightRef = useRef<HTMLElement | null>(null)

  // Detect form type from URL
  useEffect(() => {
    if (forceFormType) {
      setFormType(forceFormType)
      return
    }

    // Auto-detect form type from pathname
    if (pathname.includes('/events')) {
      setFormType('event')
    } else if (pathname.includes('/posts') || pathname.includes('/content')) {
      setFormType('post')
    } else if (pathname.includes('/speakers') || pathname.includes('/announcements')) {
      setFormType('speaker')
    } else {
      setFormType('generic')
    }
  }, [pathname, forceFormType])

  // Build field cache and schema for faster lookups and AI context
  const buildFieldCache = useCallback(() => {
    const startTime = performance.now()
    fieldCacheRef.current.clear()

    const discoveredSchema: FieldSchema[] = []

    // Find all form fields including checkboxes, radios, and selects
    const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )

    fields.forEach(field => {
      const name = field.name || field.id || field.getAttribute('data-field')
      if (name) {
        // Skip file inputs, buttons, hidden, and submit
        if (field.type === 'file' || field.type === 'button' || field.type === 'submit' || field.type === 'hidden') {
          return
        }

        // Add to cache (including checkbox, radio, select)
        fieldCacheRef.current.set(name, {
          element: field,
          name,
          selector: field.name ? `[name="${name}"]` : `[id="${name}"]`
        })

        // Try to find associated label
        let label = ''
        if (field.id) {
          const labelElement = document.querySelector(`label[for="${field.id}"]`)
          label = labelElement?.textContent?.trim() || ''
        }
        if (!label) {
          // Try to find parent label
          const parentLabel = field.closest('label')
          label = parentLabel?.textContent?.trim() || ''
        }
        if (!label) {
          // Use placeholder as fallback (select elements don't have placeholder)
          label = ('placeholder' in field ? field.placeholder : undefined) || name
        }

        // Determine field type - map checkboxes to boolean
        let fieldType = field.type || 'text'
        if (field.type === 'checkbox') {
          fieldType = 'boolean'
        } else if (field.tagName === 'SELECT') {
          fieldType = 'select'
        }

        // Add to schema for AI context
        discoveredSchema.push({
          name,
          type: fieldType,
          label: label,
          required: field.required || false,
          placeholder: ('placeholder' in field ? field.placeholder : undefined) || undefined,
        })
      }
    })

    // Update field schema state
    setFieldSchema(discoveredSchema)

    const elapsed = performance.now() - startTime
    console.log(`[UniversalVA] Built field cache: ${fieldCacheRef.current.size} fields in ${elapsed.toFixed(2)}ms`)
    console.log(`[UniversalVA] Discovered schema:`, discoveredSchema)
  }, [])

  // Detect if page has forms and build cache
  useEffect(() => {
    const checkForForms = () => {
      const forms = document.querySelectorAll('form, input, textarea, select')
      const hasFormElements = forms.length > 0
      setHasForm(hasFormElements)

      if (hasFormElements) {
        buildFieldCache()
      }
    }

    // Check immediately
    checkForForms()

    // Re-check when DOM changes (for dynamic forms)
    const observer = new MutationObserver(() => {
      checkForForms()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [pathname, buildFieldCache])

  // Optimized field finder with caching
  const findField = useCallback((fieldName: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null => {
    // Try cache first
    const cached = fieldCacheRef.current.get(fieldName)
    if (cached && document.body.contains(cached.element)) {
      return cached.element
    }

    // Cache miss - try different selector strategies
    const selectors = [
      `[name="${fieldName}"]`,
      `[id="${fieldName}"]`,
      `[data-field="${fieldName}"]`,
    ]

    for (const selector of selectors) {
      const field = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      if (field) {
        // Update cache
        fieldCacheRef.current.set(fieldName, { element: field, name: fieldName, selector })
        return field
      }
    }

    return null
  }, [])

  // Enhanced field highlighting with visual indicator
  const highlightField = useCallback((field: HTMLElement) => {
    const timestamp = new Date().toLocaleTimeString()

    // Remove previous highlight
    if (activeHighlightRef.current) {
      activeHighlightRef.current.classList.remove(
        'ring-4',
        'ring-fuchsia-500',
        'ring-offset-2',
        'ring-offset-purple-900/50'
      )
      const oldIndicator = activeHighlightRef.current.parentElement?.querySelector('.field-indicator')
      if (oldIndicator) oldIndicator.remove()
    }

    // Scroll into view with optimized timing
    requestAnimationFrame(() => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    // Focus with delay for smooth scrolling
    setTimeout(() => {
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) {
        field.focus()
      }
    }, 300)

    // Add enhanced highlight effect
    field.classList.add('ring-4', 'ring-fuchsia-500', 'ring-offset-2', 'ring-offset-purple-900/50')

    // Create visual indicator
    const indicator = document.createElement('div')
    indicator.className = 'field-indicator absolute -top-8 left-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-bounce z-50'
    indicator.textContent = '✨ Filling now'
    indicator.style.cssText = 'animation: bounce 1s ease-in-out 3;'

    // Insert indicator relative to field
    const parent = field.parentElement
    if (parent) {
      const originalPosition = parent.style.position
      if (!originalPosition || originalPosition === 'static') {
        parent.style.position = 'relative'
      }
      parent.appendChild(indicator)
    }

    const fieldName = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement
      ? field.name || field.id
      : field.id

    activeHighlightRef.current = field

    console.log(`[UniversalVA:${timestamp}] Highlighting field: ${fieldName}`)

    // Remove highlight after duration
    setTimeout(() => {
      field.classList.remove('ring-4', 'ring-fuchsia-500', 'ring-offset-2', 'ring-offset-purple-900/50')
      indicator.remove()
      if (activeHighlightRef.current === field) {
        activeHighlightRef.current = null
      }
    }, 3000)
  }, [])

  // Optimized field value setter with React event triggering
  const setFieldValue = useCallback((field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | boolean) => {
    const startTime = performance.now()

    // Handle checkboxes (boolean fields)
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      const boolValue = typeof value === 'boolean' ? value : value === 'true' || value === 'yes' || value === '1'
      field.checked = boolValue
      field.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`[UniversalVA] Set checkbox ${field.name} to ${boolValue}`)
      return
    }

    // Handle radio buttons
    if (field instanceof HTMLInputElement && field.type === 'radio') {
      if (field.value === String(value)) {
        field.checked = true
        field.dispatchEvent(new Event('change', { bubbles: true }))
        console.log(`[UniversalVA] Set radio ${field.name} to ${value}`)
      }
      return
    }

    // Handle select dropdowns
    if (field instanceof HTMLSelectElement) {
      field.value = String(value)
      field.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`[UniversalVA] Set select ${field.name} to ${value}`)
      return
    }

    // Get native value setter for text/textarea fields
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set

    // Set value using native setter to bypass React's control
    if (field instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(field, String(value))
    } else if (field instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(field, String(value))
    } else {
      field.value = String(value)
    }

    // Dispatch React events
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))

    const elapsed = performance.now() - startTime
    console.log(`[UniversalVA] Set field value in ${elapsed.toFixed(2)}ms`)
  }, [])

  // Debounced form update handler for performance
  const handleFormUpdate = useCallback((data: any, currentField?: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[UniversalVA:${timestamp}] Form update requested:`, data)

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Debounce the update slightly to batch rapid changes
    updateTimeoutRef.current = setTimeout(() => {
      const updateStart = performance.now()
      let fieldsUpdated = 0

      // Iterate through all form fields and populate them
      Object.entries(data).forEach(([fieldName, value]) => {
        if (value === null || value === undefined) return

        const field = findField(fieldName)

        if (field) {
          setFieldValue(field, String(value))
          fieldsUpdated++
          console.log(`[UniversalVA:${timestamp}] ✓ ${fieldName} = "${value}"`)
        } else {
          console.warn(`[UniversalVA:${timestamp}] ✗ Field not found: ${fieldName}`)
        }
      })

      const updateElapsed = performance.now() - updateStart
      console.log(`[UniversalVA:${timestamp}] Updated ${fieldsUpdated} fields in ${updateElapsed.toFixed(2)}ms`)

      // Highlight current field if specified
      if (currentField) {
        const field = findField(currentField)
        if (field) {
          highlightField(field)
        }
      }
    }, 50) // 50ms debounce
  }, [findField, setFieldValue, highlightField])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      if (activeHighlightRef.current) {
        activeHighlightRef.current.classList.remove(
          'ring-4',
          'ring-fuchsia-500',
          'ring-offset-2',
          'ring-offset-purple-900/50'
        )
      }
    }
  }, [])

  // Only show if page has forms
  if (!hasForm) {
    return null
  }

  return (
    <ContinuousVoiceAssistant
      isActive={isActive}
      onToggle={() => setIsActive(!isActive)}
      formType={formType}
      onFormUpdate={handleFormUpdate}
      fieldSchema={fieldSchema}
    />
  )
}
