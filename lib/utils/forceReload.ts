/**
 * Force a full page reload to ensure UI reflects latest server data
 * Used after successful mutations (create/update/delete) in trip area
 */
export function forceTripReload(tripId: string, target?: 'expenses' | 'trip') {
  // Build target URL
  const baseUrl = `/trips/${tripId}`
  
  // Add cache-busting query param to force fresh data fetch
  const urlWithCacheBuster = `${baseUrl}?r=${Date.now()}`
  
  // Use window.location.assign for full page reload
  if (typeof window !== 'undefined') {
    window.location.assign(urlWithCacheBuster)
  }
}

