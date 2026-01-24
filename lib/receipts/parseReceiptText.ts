/**
 * Deterministic parsing helpers for receipt text extracted via OCR.
 * Pure functions with no side effects.
 */

interface ParseResult<T> {
  value: T | null
  confidence: number // 0-1
}

/**
 * Extract total amount from receipt text.
 * Looks for TOTAL keywords and nearby numbers.
 */
export function parseAmount(text: string): ParseResult<number> {
  const lines = text.split(/\r?\n/)
  
  // Total keywords (multilingual)
  const totalKeywords = [
    /\btotal\b/i,
    /\bamount\s+due\b/i,
    /\bgrand\s+total\b/i,
    /\bbalance\s+due\b/i,
    /\bamount\s+payable\b/i,
    /\bto\s+pay\b/i,
    /סה["']?כ/i, // Hebrew total
    /לתשלום/i, // Hebrew to pay
    /\bsumme\b/i, // German
    /\btotaal\b/i, // Dutch
    /\btotale\b/i, // Italian
  ]

  // Number pattern: optional currency symbol, digits with optional comma/period separators
  const numberPattern = /[$€£¥₪₹]?\s*(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{2})?)/g

  let bestAmount: number | null = null
  let bestConfidence = 0

  // Strategy 1: Find amounts near TOTAL keywords (high confidence)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hasTotal = totalKeywords.some(kw => kw.test(line))
    
    if (hasTotal) {
      // Check current line and next 2 lines for numbers
      const searchLines = [line, lines[i + 1] || "", lines[i + 2] || ""].join(" ")
      const matches = Array.from(searchLines.matchAll(numberPattern))
      
      if (matches.length > 0) {
        // Take the largest number (usually the total)
        const amounts = matches.map(m => parseFloat(m[1].replace(/,/g, "")))
        const maxAmount = Math.max(...amounts)
        
        if (maxAmount > 0 && maxAmount < 1000000) { // Sanity check
          bestAmount = maxAmount
          bestConfidence = 0.9
          break
        }
      }
    }
  }

  // Strategy 2: If no TOTAL found, look for largest plausible amount (lower confidence)
  if (!bestAmount) {
    const allMatches = Array.from(text.matchAll(numberPattern))
    if (allMatches.length > 0) {
      const amounts = allMatches
        .map(m => parseFloat(m[1].replace(/,/g, "")))
        .filter(n => n > 0 && n < 1000000)
      
      if (amounts.length > 0) {
        bestAmount = Math.max(...amounts)
        bestConfidence = 0.5
      }
    }
  }

  return { value: bestAmount, confidence: bestConfidence }
}

/**
 * Extract currency from receipt text.
 * Looks for ISO codes and symbols with context.
 */
export function parseCurrency(text: string): ParseResult<string> {
  const upperText = text.toUpperCase()
  
  // ISO codes
  const isoCodes = ["AUD", "USD", "EUR", "GBP", "ILS", "CAD", "JPY", "NZD", "CHF", "SEK", "NOK", "DKK", "SGD", "HKD"]
  for (const code of isoCodes) {
    if (new RegExp(`\\b${code}\\b`).test(upperText)) {
      return { value: code, confidence: 0.95 }
    }
  }

  // Symbols with context
  if (/₪/.test(text)) {
    return { value: "ILS", confidence: 0.9 }
  }
  if (/€/.test(text)) {
    return { value: "EUR", confidence: 0.9 }
  }
  if (/£/.test(text)) {
    return { value: "GBP", confidence: 0.9 }
  }

  // $ with context (could be AUD, USD, CAD, etc.)
  if (/\$/.test(text)) {
    // Australian hints
    const auHints = [
      /\bAUSTRALIA\b/i,
      /\bAU\b/,
      /\bABN\b/, // Australian Business Number
      /\bWOOLWORTHS\b/i,
      /\bCOLES\b/i,
      /\bMELBOURNE\b/i,
      /\bSYDNEY\b/i,
      /\bBRISBANE\b/i,
      /\bPERTH\b/i,
      /\bADELAIDE\b/i,
    ]
    if (auHints.some(hint => hint.test(text))) {
      return { value: "AUD", confidence: 0.85 }
    }

    // Default to USD for $ without context
    return { value: "USD", confidence: 0.6 }
  }

  return { value: null, confidence: 0 }
}

/**
 * Extract date from receipt text.
 * Supports common formats and normalizes to YYYY-MM-DD.
 */
export function parseDate(text: string): ParseResult<string> {
  const lines = text.split(/\r?\n/)
  
  // Patterns for various date formats
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/,
    // YYYY-MM-DD or YYYY/MM/DD
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    // DD MMM YYYY (e.g., 15 Jan 2024)
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
  ]

  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  }

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        try {
          let year: string, month: string, day: string

          if (match[0].includes("-") && match[1].length === 4) {
            // YYYY-MM-DD format
            year = match[1]
            month = match[2].padStart(2, "0")
            day = match[3].padStart(2, "0")
          } else if (match[2] && isNaN(Number(match[2]))) {
            // DD MMM YYYY format
            day = match[1].padStart(2, "0")
            month = monthMap[match[2].toLowerCase().substring(0, 3)]
            year = match[3]
          } else {
            // DD/MM/YYYY format (common in AU, EU)
            day = match[1].padStart(2, "0")
            month = match[2].padStart(2, "0")
            year = match[3]
          }

          // Validate
          const dateObj = new Date(`${year}-${month}-${day}`)
          if (!isNaN(dateObj.getTime())) {
            const normalized = `${year}-${month}-${day}`
            return { value: normalized, confidence: 0.85 }
          }
        } catch (e) {
          continue
        }
      }
    }
  }

  return { value: null, confidence: 0 }
}

/**
 * Extract merchant name from receipt text.
 * Usually the first prominent line.
 */
export function parseMerchant(text: string): ParseResult<string> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  
  // Skip lines that look like headers/footers/tax info
  const skipPatterns = [
    /^TAX\s+INVOICE/i,
    /^INVOICE/i,
    /^RECEIPT/i,
    /^ABN[:]/i,
    /^ACN[:]/i,
    /^PH[:]/i,
    /^PHONE[:]/i,
    /^TEL[:]/i,
    /^FAX[:]/i,
    /^EMAIL[:]/i,
    /^WWW\./i,
    /^HTTP/i,
    /^\d+\s+\d+\s+\d+/, // Phone numbers
    /^[A-Z]{2,3}\s*\d{5}/, // Postcodes
    /\d{4,}/, // Long numbers (likely ABN/ACN)
  ]

  for (const line of lines) {
    // Skip if matches skip patterns
    if (skipPatterns.some(p => p.test(line))) {
      continue
    }

    // Must have some letters
    if (!/[A-Za-z]{2,}/.test(line)) {
      continue
    }

    // Take first valid line
    const cleaned = line
      .replace(/\b(PTY|LTD|LLC|INC|CORP|CO)\b\.?/gi, "")
      .trim()
    
    if (cleaned.length >= 3 && cleaned.length <= 50) {
      return { value: cleaned, confidence: 0.7 }
    }
  }

  return { value: null, confidence: 0 }
}

/**
 * Parse all fields from receipt text.
 */
export function parseReceiptText(text: string) {
  const amountResult = parseAmount(text)
  const currencyResult = parseCurrency(text)
  const dateResult = parseDate(text)
  const merchantResult = parseMerchant(text)

  return {
    amount: amountResult.value,
    currency: currencyResult.value,
    date: dateResult.value,
    merchant: merchantResult.value,
    confidence: {
      amount: amountResult.confidence,
      currency: currencyResult.confidence,
      date: dateResult.confidence,
      merchant: merchantResult.confidence,
    }
  }
}

