"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  selected?: Date
  onSelect: (date: Date) => void
  locale?: string
  disabled?: (date: Date) => boolean
  dir?: "ltr" | "rtl"
}

const Calendar = ({ selected, onSelect, locale = "en", disabled, dir = "ltr" }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthName = currentMonth.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    month: "long",
    year: "numeric",
  })

  const weekDays = locale === "he"
    ? ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
    : ["S", "M", "T", "W", "T", "F", "S"]

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (!disabled || !disabled(date)) {
      onSelect(date)
    }
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  return (
    <div className="p-3" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between space-x-1 mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:bg-slate-100 hover:text-slate-900",
            "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium text-slate-900">{monthName}</div>
        <button
          type="button"
          onClick={goToNextMonth}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:bg-slate-100 hover:text-slate-900",
            "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week days */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="flex">
            {weekDays.map((day, i) => (
              <th
                key={i}
                className="text-slate-500 rounded-md w-9 font-normal text-[0.8rem]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Build weeks */}
          {(() => {
            const weeks: JSX.Element[] = []
            let days: JSX.Element[] = []
            
            // Add empty cells for days before month starts
            for (let i = 0; i < firstDayOfMonth; i++) {
              days.push(
                <td key={`empty-${i}`} className="h-9 w-9 text-center p-0">
                  <div className="h-9 w-9" />
                </td>
              )
            }
            
            // Add days of month
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              const isDisabled = disabled && disabled(date)
              
              days.push(
                <td key={day} className="h-9 w-9 text-center text-sm p-0">
                  <button
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                      "disabled:pointer-events-none disabled:opacity-50",
                      "h-9 w-9",
                      isSelected(day)
                        ? "bg-sky-500 text-white hover:bg-sky-600 focus:bg-sky-600"
                        : isToday(day)
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-100 hover:text-slate-900",
                      isDisabled && "text-slate-300 opacity-50"
                    )}
                  >
                    {day}
                  </button>
                </td>
              )
              
              // Start new week after Saturday
              if ((firstDayOfMonth + day) % 7 === 0 || day === daysInMonth) {
                weeks.push(
                  <tr key={`week-${weeks.length}`} className="flex w-full mt-2">
                    {days}
                  </tr>
                )
                days = []
              }
            }
            
            return weeks
          })()}
        </tbody>
      </table>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

