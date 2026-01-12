import { z } from "zod"

export const ExchangeRateSchema = z.object({
  baseCurrency: z.string().length(3, "Currency must be 3-letter ISO code"),
  rates: z.record(z.string(), z.number()),
  updatedAt: z.number(),
})

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>

