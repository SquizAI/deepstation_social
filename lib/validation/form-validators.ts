/**
 * Form Validation Utilities
 * Provides user-friendly validation for common form field types
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate a date string
 */
export function validateDate(dateStr: string): ValidationResult {
  if (!dateStr || dateStr.trim() === '') {
    return { isValid: false, error: 'Date is required' }
  }

  const date = new Date(dateStr)

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format. Please use YYYY-MM-DD' }
  }

  // Check if date is in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) {
    return { isValid: false, error: 'Date cannot be in the past' }
  }

  return { isValid: true }
}

/**
 * Validate a time string
 */
export function validateTime(timeStr: string): ValidationResult {
  if (!timeStr || timeStr.trim() === '') {
    return { isValid: false, error: 'Time is required' }
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

  if (!timeRegex.test(timeStr)) {
    return { isValid: false, error: 'Invalid time format. Please use HH:MM (e.g., 14:30)' }
  }

  return { isValid: true }
}

/**
 * Validate a URL
 */
export function validateUrl(url: string, required: boolean = false): ValidationResult {
  if (!url || url.trim() === '') {
    if (required) {
      return { isValid: false, error: 'URL is required' }
    }
    return { isValid: true }
  }

  try {
    const urlObj = new URL(url)

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must start with http:// or https://' }
    }

    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Invalid URL format. Please include https://' }
  }
}

/**
 * Validate an email address
 */
export function validateEmail(email: string, required: boolean = false): ValidationResult {
  if (!email || email.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Email is required' }
    }
    return { isValid: true }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format. Please use format: name@example.com' }
  }

  return { isValid: true }
}

/**
 * Validate character limits
 */
export function validateLength(
  text: string,
  min: number = 0,
  max: number = Infinity,
  fieldName: string = 'Field'
): ValidationResult {
  const length = text?.length || 0

  if (length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters (currently ${length})`
    }
  }

  if (length > max) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${max} characters (currently ${length})`
    }
  }

  return { isValid: true }
}

/**
 * Validate a phone number
 */
export function validatePhone(phone: string, required: boolean = false): ValidationResult {
  if (!phone || phone.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Phone number is required' }
    }
    return { isValid: true }
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')

  // Check if it's a valid format (10-15 digits, optionally starting with +)
  const phoneRegex = /^\+?[0-9]{10,15}$/

  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid phone format. Use format: +1234567890 or (123) 456-7890'
    }
  }

  return { isValid: true }
}

/**
 * Validate a number within a range
 */
export function validateNumber(
  value: string | number,
  min: number = -Infinity,
  max: number = Infinity,
  fieldName: string = 'Value'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` }
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} must be no more than ${max}` }
  }

  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} cannot be empty` }
  }

  return { isValid: true }
}

/**
 * Validate form data against schema
 */
export function validateFormData(
  data: Record<string, any>,
  schema: Array<{ name: string; type: string; label: string; required: boolean }>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of schema) {
    const value = data[field.name]
    const label = field.label || field.name

    // Check required fields
    if (field.required) {
      const reqResult = validateRequired(value, label)
      if (!reqResult.isValid) {
        errors[field.name] = reqResult.error!
        continue
      }
    }

    // Skip validation if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      continue
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailResult = validateEmail(value, field.required)
        if (!emailResult.isValid) {
          errors[field.name] = emailResult.error!
        }
        break

      case 'url':
        const urlResult = validateUrl(value, field.required)
        if (!urlResult.isValid) {
          errors[field.name] = urlResult.error!
        }
        break

      case 'tel':
        const phoneResult = validatePhone(value, field.required)
        if (!phoneResult.isValid) {
          errors[field.name] = phoneResult.error!
        }
        break

      case 'date':
        const dateResult = validateDate(value)
        if (!dateResult.isValid) {
          errors[field.name] = dateResult.error!
        }
        break

      case 'time':
        const timeResult = validateTime(value)
        if (!timeResult.isValid) {
          errors[field.name] = timeResult.error!
        }
        break

      case 'number':
        const numResult = validateNumber(value, undefined, undefined, label)
        if (!numResult.isValid) {
          errors[field.name] = numResult.error!
        }
        break
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
