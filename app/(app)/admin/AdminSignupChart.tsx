"use client"

import { useI18n } from "@/lib/i18n/I18nProvider"
import { SignupTrendDataPoint } from "@/lib/server/adminStats"
import { Card } from "@/components/ui/card"
import { useMemo } from "react"

interface AdminSignupChartProps {
  data: SignupTrendDataPoint[]
}

export function AdminSignupChart({ data }: AdminSignupChartProps) {
  const { t } = useI18n()

  const chartData = useMemo(() => {
    if (data.length === 0) return null

    const maxCount = Math.max(...data.map((d) => d.count), 1)
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = 800
    const chartHeight = 300
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    // Calculate bars
    const barWidth = innerWidth / data.length
    const bars = data.map((d, i) => {
      const x = padding.left + i * barWidth
      const barHeight = (d.count / maxCount) * innerHeight
      const y = padding.top + innerHeight - barHeight
      return { x, y, width: barWidth * 0.8, height: barHeight, ...d }
    })

    // Y-axis labels (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = Math.ceil((maxCount / 4) * (4 - i))
      const y = padding.top + (i / 4) * innerHeight
      return { value, y }
    })

    // X-axis labels (show first, middle, last)
    const xTicks = [
      { label: data[0]?.date || "", x: padding.left + barWidth / 2 },
      {
        label: data[Math.floor(data.length / 2)]?.date || "",
        x: padding.left + (data.length / 2) * barWidth,
      },
      {
        label: data[data.length - 1]?.date || "",
        x: padding.left + (data.length - 1) * barWidth + barWidth / 2,
      },
    ]

    return {
      chartWidth,
      chartHeight,
      padding,
      innerWidth,
      innerHeight,
      bars,
      yTicks,
      xTicks,
      maxCount,
    }
  }, [data])

  const hasSignups = data.some((d) => d.count > 0)

  if (!chartData || !hasSignups) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center text-slate-400 text-sm min-h-[200px]">
          {t("admin.noSignups")}
        </div>
      </Card>
    )
  }

  const { chartWidth, chartHeight, padding, innerHeight, bars, yTicks, xTicks } = chartData

  return (
    <Card className="p-6">
      <div className="text-sm text-slate-600 mb-4">{t("admin.last30Days")}</div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ minWidth: "600px" }}
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

          {/* Bars */}
          {bars.map((bar, i) => (
            <g key={i}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill="#0ea5e9"
                opacity={0.8}
                rx="2"
              />
              {bar.count > 0 && (
                <text
                  x={bar.x + bar.width / 2}
                  y={bar.y - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-600"
                  style={{ fontSize: "10px" }}
                >
                  {bar.count}
                </text>
              )}
            </g>
          ))}

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
              {tick.value}
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={padding.top + innerHeight + 25}
              textAnchor="middle"
              className="text-xs fill-slate-500"
              style={{ fontSize: "11px" }}
            >
              {new Date(tick.label).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={padding.left - 35}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            className="text-xs fill-slate-500"
            style={{ fontSize: "10px" }}
            transform={`rotate(-90, ${padding.left - 35}, ${
              padding.top + innerHeight / 2
            })`}
          >
            {t("admin.signupsPerDay")}
          </text>
        </svg>
      </div>
    </Card>
  )
}

