"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"
import { Calendar } from "./calendar"

interface DatePickerInputProps {
  id?: string
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  min?: string
  className?: string
  locale?: string
}

const DatePickerInput = React.forwardRef<HTMLDivElement, DatePickerInputProps>(
  ({ id, value, onChange, placeholder, disabled, required, min, className, locale = "en" }, ref) => {
    const [open, setOpen] = React.useState(false)
    const isRTL = locale === "he"

    const selectedDate = value ? new Date(value + 'T00:00:00') : undefined

    const handleSelect = (date: Date) => {
      // Normalize to local date to avoid timezone shifts
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const isoString = `${year}-${month}-${day}`
      onChange?.({ target: { value: isoString } })
      setOpen(false)
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString + 'T00:00:00')
      return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    const isDateDisabled = (date: Date) => {
      if (!min) return false
      const minDate = new Date(min + 'T00:00:00')
      const compareDate = new Date(date)
      minDate.setHours(0, 0, 0, 0)
      compareDate.setHours(0, 0, 0, 0)
      return compareDate < minDate
    }

    return (
      <div ref={ref} className="w-full max-w-full min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            onClick={() => !disabled && setOpen(!open)}
            className="w-full"
          >
            <button
              type="button"
              id={id}
              disabled={disabled}
              className={cn(
                "premium-input flex h-10 w-full min-w-0 max-w-full items-center justify-between px-3 py-2 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-50",
                !value && "text-slate-400",
                isRTL && "text-right",
                className
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <span className="truncate">
                {value ? formatDate(value) : (placeholder || (isRTL ? "בחר תאריך" : "Pick a date"))}
              </span>
              <CalendarIcon className={cn("h-4 w-4 shrink-0 opacity-50", isRTL ? "mr-2" : "ml-2")} />
            </button>
          </PopoverTrigger>
          {open && (
            <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={4}>
              <Calendar
                selected={selectedDate}
                onSelect={handleSelect}
                locale={locale}
                disabled={isDateDisabled}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </PopoverContent>
          )}
        </Popover>
        {required && (
          <input
            type="text"
            value={value || ""}
            required
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)

DatePickerInput.displayName = "DatePickerInput"

export { DatePickerInput }

