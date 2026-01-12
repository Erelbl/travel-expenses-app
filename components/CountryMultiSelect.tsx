"use client"

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRIES_DATA, CountryData, searchCountries, getCountryName } from '@/lib/utils/countries.data';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface CountryMultiSelectProps {
  value: string[]; // Array of country codes
  onChange: (codes: string[]) => void;
  placeholder?: string;
  className?: string;
}

// Helper to convert ISO country code to emoji flag
function flagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return '🌍';
  const A = 0x1F1E6;
  const base = 'A'.charCodeAt(0);
  return String.fromCodePoint(A + (cc.charCodeAt(0) - base), A + (cc.charCodeAt(1) - base));
}

export const CountryMultiSelect: React.FC<CountryMultiSelectProps> = ({
  value,
  onChange,
  placeholder = 'Search countries...',
  className,
}) => {
  const { locale } = useI18n();
  const flagEmoji = (code: string) => {
    if (!code || code.length !== 2) return '';
    const base = 0x1f1e6;
    const chars = code.toUpperCase().split('');
    return String.fromCodePoint(
      base + chars[0].charCodeAt(0) - 65,
      base + chars[1].charCodeAt(0) - 65
    );
  };  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<CountryData[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search term
  useEffect(() => {
    if (searchTerm) {
      const results = searchCountries(searchTerm).filter(
        c => !value.includes(c.code)
      );
      setFilteredCountries(results);
    } else {
      setFilteredCountries(
        COUNTRIES_DATA.filter(c => !value.includes(c.code)).slice(0, 10)
      );
    }
    setFocusedIndex(-1);
  }, [searchTerm, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCountry = (country: CountryData) => {
    onChange([...value, country.code]);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemoveCountry = (code: string) => {
    onChange(value.filter(c => c !== code));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Backspace' && !searchTerm && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCountries.length) {
          handleAddCountry(filteredCountries[focusedIndex]);
        }
        break;
    }
  };

  const selectedCountries = COUNTRIES_DATA.filter(c => value.includes(c.code));

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Input area with chips */}
      <div
        className={cn(
          'min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text transition-colors',
          isOpen && 'border-sky-500 ring-2 ring-sky-500/20'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected country chips - NO FLAGS, larger font */}
        {selectedCountries.map(country => (
          <div
            key={country.code}
            className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-md px-3 py-2 text-base font-semibold"
          >
            <span>{getCountryName(country.code, locale)}</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleRemoveCountry(country.code);
              }}
              className="hover:bg-sky-100 rounded p-0.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>

      {/* Dropdown - FLAGS from ISO codes */}
      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[300px] overflow-auto">
          {filteredCountries.map((country, index) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleAddCountry(country)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors',
                index === focusedIndex && 'bg-slate-100'
              )}
            >
              <span className="text-xl leading-none">
                {flagEmoji(country.code)}
                                          </span>
              <div className="flex-1 min-w-0 font-medium text-slate-900">
                {getCountryName(country.code, locale)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && searchTerm && filteredCountries.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500 text-center">
          {locale === 'he' ? 'לא נמצאו מדינות' : 'No countries found'}
        </div>
      )}
    </div>
  );
};

