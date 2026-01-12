/**
 * Trip helper functions for current country detection and defaults
 */

import { Trip, ItineraryLeg } from '@/lib/schemas/trip.schema';
import { getCountryCurrency } from './countries.data';

/**
 * Get the current country based on today's date and itinerary legs
 */
export function getCurrentCountry(trip: Trip): string | null {
  if (!trip.itineraryLegs || trip.itineraryLegs.length === 0) {
    // Fallback to first planned country
    return trip.plannedCountries?.[0] || null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the leg that contains today's date
  for (const leg of trip.itineraryLegs) {
    const startDate = leg.startDate ? new Date(leg.startDate) : null;
    const endDate = leg.endDate ? new Date(leg.endDate) : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }

    // Check if today falls within this leg
    if (startDate && today >= startDate) {
      if (!endDate || today <= endDate) {
        return leg.countryCode;
      }
    }
  }

  // If no leg matches, return the first planned country or the first leg's country
  return trip.plannedCountries?.[0] || trip.itineraryLegs[0]?.countryCode || null;
}

/**
 * Get default currency for a trip based on current country
 */
export function getDefaultCurrency(trip: Trip): string {
  const currentCountry = getCurrentCountry(trip);
  if (currentCountry) {
    const currency = getCountryCurrency(currentCountry);
    if (currency) return currency;
  }
  return trip.baseCurrency;
}

/**
 * Check if a date falls within trip dates
 */
export function isDateInTrip(date: Date, trip: Trip): boolean {
  if (!trip.startDate) return true; // No start date means open trip
  
  const tripStart = new Date(trip.startDate);
  tripStart.setHours(0, 0, 0, 0);
  
  if (date < tripStart) return false;
  
  if (trip.endDate) {
    const tripEnd = new Date(trip.endDate);
    tripEnd.setHours(0, 0, 0, 0);
    return date <= tripEnd;
  }
  
  return true; // No end date means ongoing trip
}

