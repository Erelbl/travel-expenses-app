"use client"

import { useMemo } from "react"

export interface TimeSeriesDataPoint {
  date: string
  amount: number
  isFuture?: boolean
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[]
  height?: number
  currency: string
  formatCurrency: (amount: number, currency: string) => string
  highlightDates?: string[] | null
}

/**
 * Enhanced time series chart with bars + 3-day moving average
 * Replaces simple line chart to:
 * - Show daily spending as bars (better for discrete daily data)
 * - Add 3-day moving average line to smooth out noise
 * - Reduce visual clutter by removing dots
 * - Make peaks/valleys more visible
 */
export function TimeSeriesChart({
  data,
  height = 300,
  currency,
  formatCurrency,
  highlightDates = null,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null

    // Calculate 3-day moving average
    const movingAverage = data.map((d, i) => {
      const start = Math.max(0, i - 1)
      const end = Math.min(data.length, i + 2)
      const window = data.slice(start, end)
      const avg = window.reduce((sum, item) => sum + item.amount, 0) / window.length
      return avg
    })

    const maxAmount = Math.max(...data.map((d) => d.amount), ...movingAverage)
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartWidth = 800
    const chartHeight = height
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    // Bar width calculation
    const barWidth = Math.max(4, Math.min(24, innerWidth / data.length * 0.7))
    const barSpacing = innerWidth / data.length

    // Calculate bar positions
    const bars = data.map((d, i) => {
      const x = padding.left + (i * barSpacing) + (barSpacing - barWidth) / 2
      const barHeight = (d.amount / (maxAmount || 1)) * innerHeight
      const y = padding.top + innerHeight - barHeight
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        ...d,
      }
    })

    // Calculate moving average line points
    const maPoints = movingAverage.map((avg, i) => {
      const x = padding.left + (i * barSpacing) + barSpacing / 2
      const y = padding.top + innerHeight - (avg / (maxAmount || 1)) * innerHeight
      return { x, y, value: avg, isFuture: data[i].isFuture }
    })

    // Split MA into past and future segments
    const pastMAPoints = maPoints.filter((p) => !p.isFuture)
    const futureMAPoints = maPoints.filter((p) => p.isFuture)
    
    if (pastMAPoints.length > 0 && futureMAPoints.length > 0) {
      futureMAPoints.unshift(pastMAPoints[pastMAPoints.length - 1])
    }

    // Create path strings for moving average
    const createPath = (pts: typeof maPoints) => {
      if (pts.length === 0) return ""
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    }

    const pastMAPath = createPath(pastMAPoints)
    const futureMAPath = createPath(futureMAPoints)

    // Y-axis labels (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = (maxAmount / 4) * (4 - i)
      const y = padding.top + (i / 4) * innerHeight
      return { value, y }
    })

    // X-axis labels (show first, middle, last)
    const xTicks = data.length > 1 ? [
      { label: data[0]?.date || "", x: padding.left + barSpacing / 2 },
      {
        label: data[Math.floor(data.length / 2)]?.date || "",
        x: padding.left + (data.length / 2) * barSpacing,
      },
      {
        label: data[data.length - 1]?.date || "",
        x: padding.left + (data.length - 1) * barSpacing + barSpacing / 2,
      },
    ] : [{ label: data[0]?.date || "", x: padding.left + barSpacing / 2 }]

    // Find highest and lowest days (excluding zeros)
    const nonZeroBars = bars.filter(b => b.amount > 0)
    const highestBar = nonZeroBars.length > 0 ? nonZeroBars.reduce((max, b) => b.amount > max.amount ? b : max) : null
    const lowestBar = nonZeroBars.length > 1 ? nonZeroBars.reduce((min, b) => b.amount < min.amount ? b : min) : null

    return {
      chartWidth,
      chartHeight,
      padding,
      innerWidth,
      innerHeight,
      bars,
      pastMAPath,
      futureMAPath,
      yTicks,
      xTicks,
      maxAmount,
      highestBar,
      lowestBar,
    }
  }, [data, height])

  if (!chartData || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  const {
    chartWidth,
    chartHeight,
    padding,
    innerHeight,
    bars,
    pastMAPath,
    futureMAPath,
    yTicks,
    xTicks,
    highestBar,
    lowestBar,
  } = chartData

  return (
    <div className="w-full space-y-3">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + chartData.innerWidth}
            y2={tick.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        {/* Bars (daily spend) */}
        {bars.map((bar, i) => {
          const isHighlighted = !highlightDates || highlightDates.includes(bar.date)
          const opacity = highlightDates && highlightDates.length > 0 && !isHighlighted ? 0.2 : 1
          const isHighest = highestBar && bar.date === highestBar.date && bar.amount === highestBar.amount
          const isLowest = lowestBar && bar.date === lowestBar.date && bar.amount === lowestBar.amount
          
          return (
            <g key={i}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.isFuture ? "#cbd5e1" : isHighest ? "#10b981" : isLowest ? "#f59e0b" : "#0ea5e9"}
                opacity={opacity}
                rx="2"
                style={{ transition: "opacity 0.3s ease" }}
              />
            </g>
          )
        })}

        {/* Moving average line (past) */}
        {pastMAPath && (
          <path
            d={pastMAPath}
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={highlightDates && highlightDates.length > 0 ? 0.3 : 0.7}
            style={{ transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Moving average line (future - dashed) */}
        {futureMAPath && (
          <path
            d={futureMAPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={highlightDates && highlightDates.length > 0 ? 0.3 : 0.6}
            style={{ transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={tick.y}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-xs fill-slate-500"
            style={{ fontSize: "11px" }}
          >
            {formatCurrency(tick.value, currency).replace(/\.\d+/, "")}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={padding.top + innerHeight + 25}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            className="text-xs fill-slate-500"
            style={{ fontSize: "11px" }}
          >
            {new Date(tick.label).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </text>
        ))}
      </svg>

      {/* Summary stats below chart */}
      <div className="flex items-center justify-center gap-6 text-sm pt-2">
        {highestBar && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
            <span className="text-slate-600">
              Highest: {formatCurrency(highestBar.amount, currency)} ({new Date(highestBar.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })})
            </span>
          </div>
        )}
        {data.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 rounded-sm" />
            <span className="text-slate-600">
              Average: {formatCurrency(data.reduce((sum, d) => sum + d.amount, 0) / data.length, currency)}/day
            </span>
          </div>
        )}
        {lowestBar && lowestBar.amount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
            <span className="text-slate-600">
              Lowest: {formatCurrency(lowestBar.amount, currency)} ({new Date(lowestBar.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

