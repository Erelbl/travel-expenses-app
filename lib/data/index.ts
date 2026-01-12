import { ApiTripsRepository } from "./api/trips-api.repository"
import { ApiExpensesRepository } from "./api/expenses-api.repository"
import { LocalRatesRepository } from "./local/rates-local.repository"

// Export repository instances for client-side use
export const tripsRepository = new ApiTripsRepository()
export const expensesRepository = new ApiExpensesRepository()
export const ratesRepository = new LocalRatesRepository()

// Export types
export type { TripsRepository, ExpensesRepository, RatesRepository } from "./repositories"

