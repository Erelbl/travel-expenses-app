// Log only in development to avoid performance overhead in production
export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}] Error:`, error)
  }
}

