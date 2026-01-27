import { z } from "zod"

export const ExpenseCategorySchema = z.enum([
  "Food",
  "Transport",
  "Flights",
  "Lodging",
  "Activities",
  "Shopping",
  "Health",
  "Other",
])

export const ExpenseSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  
  // Original expense data (immutable)
  amount: z.number().positive("Amount must be positive"), // Original amount
  currency: z.string().length(3, "Currency must be 3-letter ISO code"), // Original currency
  
  // Exchange rate data (stable, stored at creation time)
  baseCurrency: z.string().length(3, "Currency must be 3-letter ISO code"), // Trip's base currency
  fxRateUsed: z.number().positive().optional(), // Rate used for conversion (null if same currency)
  fxRateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(), // Date of the FX rate
  convertedAmount: z.number().positive().optional(), // Amount in base currency (null if conversion unavailable)
  fxRateSource: z.enum(["auto", "manual"]).optional(), // How the rate was obtained
  manualRateToBase: z.number().positive().optional(), // Manual rate: baseCurrency per 1 unit of expense currency
  
  // Legacy field (for backward compatibility)
  amountInBase: z.number().optional(),
  
  // Expense metadata
  category: ExpenseCategorySchema,
  country: z.string().length(2, "Country must be 2-letter ISO code"),
  merchant: z.string().optional(),
  note: z.string().optional(),
  paidByMemberId: z.string().optional(),
  createdByMemberId: z.string().optional(), // Who added this expense (for shared trips)
  createdByUser: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(), // User who created the expense (name and email)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  createdAt: z.number(),
  
  // Smart contextual fields
  numberOfNights: z.number().positive().optional(), // For accommodation analytics
  isFutureExpense: z.boolean().optional(), // Marks if expense is for future use
  usageDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(), // When expense is actually used
  pricePerNight: z.number().optional(), // Computed field for analytics
})

export const CreateExpenseSchema = ExpenseSchema.omit({ 
  id: true, 
  createdAt: true, 
  amountInBase: true,
  baseCurrency: true, // Will be set from trip
  convertedAmount: true, // Will be computed
  fxRateUsed: true, // Will be computed or provided
  fxRateDate: true, // Will be set
  fxRateSource: true, // Will be set
}).extend({
  manualRateToBase: z.number().positive().optional(), // Allow manual rate input on create
})

export type Expense = z.infer<typeof ExpenseSchema>
export type CreateExpense = z.infer<typeof CreateExpenseSchema>
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>

