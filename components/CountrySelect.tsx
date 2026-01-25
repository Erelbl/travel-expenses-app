"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES_DATA, CountryData, searchCountries, getCountryName } from '@/lib/utils/countries.data'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface CountrySelectProps {
  value: string // Country code
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

/**
 * Single country select with search/typing support.
 * Mobile-friendly with large touch targets and keyboard navigation.
 */
export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select country...',
  className,
  required = false,
}) => {
  const { locale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCountries, setFilteredCountries] = useState<CountryData[]>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Get selected country
  const selectedCountry = COUNTRIES_DATA.find(c => c.code === value)

  // Filter countries based on search term
  useEffect(() => {
    if (searchTerm) {
      const results = searchCountries(searchTerm)
      setFilteredCountries(results)
    } else {
      setFilteredCountries(COUNTRIES_DATA.slice(0, 20)) // Show top 20 by default
    }
    setFocusedIndex(-1)
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedItem = listRef.current.children[focusedIndex] as HTMLElement
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex])

  const handleSelect = (country: CountryData) => {
    onChange(country.code)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'Enter' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredCountries.length) {
          handleSelect(filteredCountries[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Selected value display / trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
          }
        }}
        className={cn(
          'min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left flex items-center justify-between transition-colors',
          isOpen && 'border-sky-500 ring-2 ring-sky-500/20',
          !selectedCountry && 'text-slate-400'
        )}
      >
        <span className="text-base">
          {selectedCountry ? getCountryName(selectedCountry.code, locale) : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-base rounded-md border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Country list */}
          <ul
            ref={listRef}
            className="max-h-[280px] overflow-y-auto py-1"
            role="listbox"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500 text-center">
                No countries found
              </li>
            ) : (
              filteredCountries.map((country, index) => (
                <li
                  key={country.code}
                  role="option"
                  aria-selected={value === country.code}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 cursor-pointer text-base transition-colors',
                    value === country.code && 'bg-sky-50 text-sky-700 font-semibold',
                    focusedIndex === index && 'bg-slate-50',
                    value !== country.code && focusedIndex !== index && 'hover:bg-slate-50'
                  )}
                  onClick={() => handleSelect(country)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span>{getCountryName(country.code, locale)}</span>
                  {value === country.code && (
                    <Check className="h-4 w-4 text-sky-600" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value}
          required={required}
        />
      )}
    </div>
  )
}

