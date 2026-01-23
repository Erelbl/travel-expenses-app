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

export function TimeSeriesChart({
  data,
  height = 240,
  currency,
  formatCurrency,
  highlightDates = null,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null

    const maxAmount = Math.max(...data.map((d) => d.amount))
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartWidth = 100
    const chartHeight = height
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    // Calculate points for the line
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
      const y = padding.top + innerHeight - (d.amount / maxAmount) * innerHeight
      return { x, y, ...d }
    })

    // Split into past and future segments
    const pastPoints = points.filter((p) => !p.isFuture)
    const futurePoints = points.filter((p) => p.isFuture)
    
    // If there's a transition point, include the last past point in future
    if (pastPoints.length > 0 && futurePoints.length > 0) {
      futurePoints.unshift(pastPoints[pastPoints.length - 1])
    }

    // Create path strings
    const createPath = (pts: typeof points) => {
      if (pts.length === 0) return ""
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    }

    const createAreaPath = (pts: typeof points) => {
      if (pts.length === 0) return ""
      const linePath = createPath(pts)
      const lastPoint = pts[pts.length - 1]
      const firstPoint = pts[0]
      return `${linePath} L ${lastPoint.x} ${padding.top + innerHeight} L ${firstPoint.x} ${padding.top + innerHeight} Z`
    }

    const pastPath = createPath(pastPoints)
    const pastAreaPath = createAreaPath(pastPoints)
    const futurePath = createPath(futurePoints)

    // Y-axis labels (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = (maxAmount / 4) * (4 - i)
      const y = padding.top + (i / 4) * innerHeight
      return { value, y }
    })

    // X-axis labels (show first, middle, last)
    const xTicks = [
      { label: data[0]?.date || "", x: padding.left },
      {
        label: data[Math.floor(data.length / 2)]?.date || "",
        x: padding.left + innerWidth / 2,
      },
      {
        label: data[data.length - 1]?.date || "",
        x: padding.left + innerWidth,
      },
    ]

    return {
      chartWidth,
      chartHeight,
      padding,
      innerWidth,
      innerHeight,
      points,
      pastPath,
      pastAreaPath,
      futurePath,
      yTicks,
      xTicks,
      maxAmount,
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
    points,
    pastPath,
    pastAreaPath,
    futurePath,
    yTicks,
    xTicks,
  } = chartData

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        preserveAspectRatio="none"
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

        {/* Past area fill (gradient) */}
        <defs>
          <linearGradient id="pastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {pastAreaPath && (
          <path d={pastAreaPath} fill="url(#pastGradient)" />
        )}

        {/* Past line */}
        {pastPath && (
          <path
            d={pastPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={highlightDates && highlightDates.length > 0 ? 0.3 : 1}
            style={{ transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Future line (dashed, lighter) */}
        {futurePath && (
          <path
            d={futurePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={highlightDates && highlightDates.length > 0 ? 0.3 : 1}
            style={{ transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Data points */}
        {points.map((point, i) => {
          const isHighlighted = !highlightDates || highlightDates.includes(point.date)
          const opacity = highlightDates && highlightDates.length > 0 && !isHighlighted ? 0.2 : 1
          return (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.isFuture ? 3 : 4}
                fill={point.isFuture ? "#cbd5e1" : "#0ea5e9"}
                stroke="white"
                strokeWidth="2"
                opacity={opacity}
                style={{ transition: "opacity 0.3s ease" }}
              />
            </g>
          )
        })}

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
            textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
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
    </div>
  )
}

