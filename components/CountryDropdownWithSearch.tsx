"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES_DATA, CountryData, searchCountries, getCountryName } from '@/lib/utils/countries.data'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface CountryDropdownWithSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  excludeCountries?: string[] // Countries to exclude from the list
  className?: string
  id?: string
  flagEmoji?: (code: string) => string
}

/**
 * Dropdown-style country selector with integrated search.
 * Designed for adding countries one at a time (e.g., Create Trip form).
 * Mobile-friendly with typing/filtering support.
 */
export const CountryDropdownWithSearch: React.FC<CountryDropdownWithSearchProps> = ({
  value,
  onChange,
  placeholder = 'Select country...',
  excludeCountries = [],
  className,
  id,
  flagEmoji,
}) => {
  const { locale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCountries, setFilteredCountries] = useState<CountryData[]>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter countries based on search term and exclusions
  useEffect(() => {
    let results: CountryData[]
    
    if (searchTerm) {
      results = searchCountries(searchTerm)
    } else {
      results = [...COUNTRIES_DATA]
    }
    
    // Exclude already selected countries
    results = results.filter(c => !excludeCountries.includes(c.code))
    
    setFilteredCountries(results)
    setFocusedIndex(-1)
  }, [searchTerm, excludeCountries])

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

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors',
          'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
          isOpen && 'border-sky-500 ring-2 ring-sky-500',
          !value && 'text-slate-400'
        )}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                {excludeCountries.length > 0 && excludeCountries.length === COUNTRIES_DATA.length
                  ? 'All countries selected'
                  : 'No countries found'}
              </li>
            ) : (
              filteredCountries.map((country, index) => (
                <li
                  key={country.code}
                  role="option"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors',
                    focusedIndex === index && 'bg-slate-50',
                    focusedIndex !== index && 'hover:bg-slate-50'
                  )}
                  onClick={() => handleSelect(country)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {flagEmoji && <span className="text-base">{flagEmoji(country.code)}</span>}
                  <span>{getCountryName(country.code, locale)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

