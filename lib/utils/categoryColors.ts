import { ExpenseCategory } from "@/lib/schemas/expense.schema"

/**
 * Category color definitions - soft pastel tints for full card backgrounds
 * Designed for clear visual differentiation while maintaining readability
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, {
  bg: string           // Full card background tint (soft pastel)
  bgHover: string      // Hover state background
  text: string         // Category label text color
  accent: string       // Optional accent color for emphasis
}> = {
  Food: {
    bg: "bg-amber-50",
    bgHover: "hover:bg-amber-100/80",
    text: "text-amber-700",
    accent: "text-amber-600",
  },
  Transport: {
    bg: "bg-blue-50",
    bgHover: "hover:bg-blue-100/80",
    text: "text-blue-700",
    accent: "text-blue-600",
  },
  Flights: {
    bg: "bg-sky-50",
    bgHover: "hover:bg-sky-100/80",
    text: "text-sky-700",
    accent: "text-sky-600",
  },
  Lodging: {
    bg: "bg-violet-50",
    bgHover: "hover:bg-violet-100/80",
    text: "text-violet-700",
    accent: "text-violet-600",
  },
  Activities: {
    bg: "bg-emerald-50",
    bgHover: "hover:bg-emerald-100/80",
    text: "text-emerald-700",
    accent: "text-emerald-600",
  },
  Shopping: {
    bg: "bg-pink-50",
    bgHover: "hover:bg-pink-100/80",
    text: "text-pink-700",
    accent: "text-pink-600",
  },
  Health: {
    bg: "bg-rose-50",
    bgHover: "hover:bg-rose-100/80",
    text: "text-rose-700",
    accent: "text-rose-600",
  },
  Other: {
    bg: "bg-slate-50",
    bgHover: "hover:bg-slate-100/80",
    text: "text-slate-600",
    accent: "text-slate-500",
  },
}

/**
 * Get category colors with fallback for unknown categories
 */
export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category as ExpenseCategory] || CATEGORY_COLORS.Other
}

