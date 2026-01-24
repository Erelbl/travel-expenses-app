import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"] // Client normalizes to JPEG

interface ExtractionResult {
  amount: number | null
  currency: string | null
  date: string | null
  merchant: string | null
  confidence: {
    amount: number
    currency: number
    date: number
    merchant: number
  }
  error?: {
    code: string
    message: string
  }
}

function createErrorResponse(code: string, message: string): ExtractionResult {
  return {
    amount: null,
    currency: null,
    date: null,
    merchant: null,
    confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
    error: { code, message },
  }
}

function createEmptyResponse(): ExtractionResult {
  return {
    amount: null,
    currency: null,
    date: null,
    merchant: null,
    confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    // Validation
    if (!file) {
      console.error("[Receipt] No file provided")
      return NextResponse.json(
        createErrorResponse("NO_FILE", "No image provided"),
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("[Receipt] Invalid file type:", file.type)
      return NextResponse.json(
        createErrorResponse("INVALID_TYPE", "Only JPEG and PNG images are accepted. Please convert the image first."),
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error("[Receipt] File too large:", file.size)
      return NextResponse.json(
        createErrorResponse("FILE_TOO_LARGE", `File size ${file.size} exceeds 10MB limit`),
        { status: 400 }
      )
    }

    console.log(`[Receipt] Processing file: ${file.type}, ${file.size} bytes`)

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[Receipt] OPENAI_API_KEY not configured")
      return NextResponse.json(
        createErrorResponse("NO_API_KEY", "Receipt extraction service not configured"),
        { status: 200 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")
    const mimeType = file.type

    // Improved prompt with multilingual support
    const prompt = `Extract receipt information from this image. Analyze carefully and return ONLY a valid JSON object.

Look for:
- TOTAL amount keywords: TOTAL, AMOUNT DUE, GRAND TOTAL, BALANCE DUE, AMOUNT PAYABLE, סה״כ, לתשלום, סכום לתשלום, SUMME, TOTAAL, TOTALE
- Currency symbols: $, €, £, ¥, ₪, ₹, or ISO codes (USD, EUR, GBP, ILS, AUD, CAD, JPY, etc.)
- Date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD.MM.YYYY
- Merchant: Usually the first prominent line (avoid address, phone, tax ID)

Return this exact JSON structure:
{
  "amount": <number or null>,
  "currency": "<3-letter ISO code or null>",
  "date": "<YYYY-MM-DD or null>",
  "merchant": "<short name or null>",
  "confidence": {
    "amount": <0.0-1.0>,
    "currency": <0.0-1.0>,
    "date": <0.0-1.0>,
    "merchant": <0.0-1.0>
  }
}

Rules:
- Extract the TOTAL/FINAL amount (not subtotals, not tax lines)
- If multiple totals exist, pick the largest or most prominent
- Currency: convert to 3-letter ISO code (e.g., ₪→ILS, $→USD if US receipt, €→EUR)
- Date: convert to YYYY-MM-DD format
- Merchant: keep short, remove "LLC", "Inc", address info
- Confidence: 0=not found, 0.5=ambiguous/low quality, 1.0=clear and certain
- Return null for any field you cannot extract
- DO NOT include any text outside the JSON`

    // Call OpenAI vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Receipt] OpenAI API error: ${response.status}`, errorText.substring(0, 200))
      return NextResponse.json(
        createErrorResponse("API_ERROR", `Provider error: ${response.status}`),
        { status: 200 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[Receipt] No content in API response", data)
      return NextResponse.json(
        createErrorResponse("EXTRACTION_EMPTY", "Provider returned empty response"),
        { status: 200 }
      )
    }

    console.log("[Receipt] Raw API response:", content.substring(0, 300))

    // Parse JSON response
    let result: ExtractionResult
    try {
      const cleanContent = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim()
      
      result = JSON.parse(cleanContent)
      
      // Validate structure
      if (!result.confidence) {
        result.confidence = { amount: 0, currency: 0, date: 0, merchant: 0 }
      }

      // Normalize currency codes
      if (result.currency) {
        result.currency = result.currency.toUpperCase()
        // Common mappings
        if (result.currency === "NIS") result.currency = "ILS"
        if (result.currency === "DOLLAR" || result.currency === "$") result.currency = "USD"
        if (result.currency === "EURO" || result.currency === "€") result.currency = "EUR"
        if (result.currency === "POUND" || result.currency === "£") result.currency = "GBP"
      }

      console.log("[Receipt] Extracted:", {
        amount: result.amount,
        currency: result.currency,
        date: result.date,
        merchant: result.merchant?.substring(0, 30),
        confidence: result.confidence,
      })

      return NextResponse.json(result, { status: 200 })
    } catch (parseError) {
      console.error("[Receipt] JSON parse error:", parseError, "Content:", content.substring(0, 200))
      return NextResponse.json(
        createErrorResponse("PARSE_ERROR", "Failed to parse extraction result"),
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("[Receipt] Unexpected error:", error)
    return NextResponse.json(
      createErrorResponse("UNKNOWN_ERROR", "Internal error during receipt processing"),
      { status: 200 }
    )
  }
}
