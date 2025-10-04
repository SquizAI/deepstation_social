'use client'

import * as React from 'react'

export interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-56 rounded-md border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg shadow-fuchsia-500/10 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  )
}

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

export function DropdownMenuItem({ children, icon, className = '', ...props }: DropdownMenuItemProps) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:backdrop-blur-sm cursor-pointer transition-all duration-300 ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />
}
