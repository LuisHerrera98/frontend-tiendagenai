'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar opción", 
  disabled = false,
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdownHeight = Math.min(options.length * 40, 240) // Estimado: 40px por item, max 240px
      const spaceBelow = window.innerHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      
      if (spaceBelow < dropdownHeight + 20 && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen, options.length])

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
          disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors
          flex items-center justify-between text-left
          ${disabled ? 'opacity-50' : 'hover:border-gray-400'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div 
          className={`
            absolute z-[100] w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto
            ${dropdownPosition === 'top' 
              ? 'bottom-full mb-1' 
              : 'top-full mt-1'
            }
          `}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`
                w-full px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                ${option.value === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-900'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}