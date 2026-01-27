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

    const selectedDate = value ? new Date(value) : undefined

    const handleSelect = (date: Date) => {
      const isoString = date.toISOString().split("T")[0]
      onChange?.({ target: { value: isoString } })
      setOpen(false)
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    const isDateDisabled = (date: Date) => {
      if (!min) return false
      const minDate = new Date(min)
      minDate.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      return date < minDate
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
            <PopoverContent className="w-auto p-0" align="start" side="bottom">
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

