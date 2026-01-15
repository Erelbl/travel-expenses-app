import { z } from "zod"

export const MemberRoleSchema = z.enum(["owner", "editor", "viewer"])

export const TripMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Member name is required"),
  role: MemberRoleSchema,
})

// Itinerary leg - optional per-country date range
export const ItineraryLegSchema = z.object({
  id: z.string(),
  countryCode: z.string().length(2, "Country must be 2-letter ISO code"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").nullable(),
})

// Trip metadata for insights
export const TripTypeSchema = z.enum(["solo", "couple", "family", "friends"])
export const TravelStyleSchema = z.enum(["budget", "balanced", "comfort", "luxury"])

export const TripSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Trip name is required"),
  // Dates are now nullable - allow trips without fixed dates
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").nullable(),
  baseCurrency: z.string().length(3, "Currency must be 3-letter ISO code"),
  countries: z.array(z.string().length(2, "Country must be 2-letter ISO code")).optional().default([]),
  plannedCountries: z.array(z.string().length(2, "Country must be 2-letter ISO code")).optional().default([]),
  currentCountry: z.string().length(2, "Country must be 2-letter ISO code").nullable().optional(),
  currentCurrency: z.string().length(3, "Currency must be 3-letter ISO code").nullable().optional(),
  // Optional itinerary with per-country date ranges
  itineraryLegs: z.array(ItineraryLegSchema).optional().default([]),
  members: z.array(TripMemberSchema).min(1, "Trip must have at least one member"),
  // Trip metadata for insights
  tripType: TripTypeSchema.nullable().optional(),
  adults: z.number().int().min(0).default(1),
  children: z.number().int().min(0).default(0),
  travelStyle: TravelStyleSchema.nullable().optional(),
  createdAt: z.number(),
})

export const CreateTripSchema = TripSchema.omit({ id: true, createdAt: true })

export type Trip = z.infer<typeof TripSchema>
export type TripMember = z.infer<typeof TripMemberSchema>
export type CreateTrip = z.infer<typeof CreateTripSchema>
export type MemberRole = z.infer<typeof MemberRoleSchema>
export type ItineraryLeg = z.infer<typeof ItineraryLegSchema>
export type TripType = z.infer<typeof TripTypeSchema>
export type TravelStyle = z.infer<typeof TravelStyleSchema>

