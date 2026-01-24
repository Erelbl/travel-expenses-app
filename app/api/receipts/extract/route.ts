import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkReceiptScanEntitlement, incrementReceiptScanUsage } from "@/lib/entitlements"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"]

// Country suggestion helpers
function suggestCountry(currency: string | null, merchant: string | null): string | null {
  if (!currency) return null

  // Currency to country mapping
  const currencyMap: Record<string, string> = {
    AUD: "AU",
    USD: "US",
    EUR: "DE", // Default to Germany, could be refined
    GBP: "GB",
    ILS: "IL",
    CAD: "CA",
    JPY: "JP",
    NZD: "NZ",
    CHF: "CH",
    SEK: "SE",
    NOK: "NO",
    DKK: "DK",
    SGD: "SG",
    HKD: "HK",
  }

  let suggestedCountry = currencyMap[currency]

  // Strengthen with merchant hints for AUD
  if (currency === "AUD" && merchant) {
    const upperMerchant = merchant.toUpperCase()
    const auMerchants = ["WOOLWORTHS", "COLES", "ALDI", "IGA", "BUNNINGS", "KMART", "TARGET"]
    const auCities = ["SYDNEY", "MELBOURNE", "BRISBANE", "PERTH", "ADELAIDE", "CANBERRA", "DARWIN", "HOBART"]
    
    if (auMerchants.some(m => upperMerchant.includes(m)) || auCities.some(c => upperMerchant.includes(c))) {
      suggestedCountry = "AU"
    }
  }

  return suggestedCountry || null
}

// Category suggestion helpers
function suggestCategory(merchant: string | null): string | null {
  if (!merchant) return null

  const upperMerchant = merchant.toUpperCase()

  // Grocery/supermarket
  if (/WOOLWORTHS|COLES|ALDI|IGA|SAFEWAY|KROGER|WALMART|TARGET|TESCO|SAINSBURY|LIDL|CARREFOUR/.test(upperMerchant)) {
    return "Food"
  }

  // Restaurants/cafes
  if (/RESTAURANT|CAFE|COFFEE|STARBUCKS|MCDONALD|BURGER|PIZZA|SUBWAY/.test(upperMerchant)) {
    return "Food"
  }

  // Transport
  if (/UBER|LYFT|TAXI|GRAB|METRO|TRAIN|BUS|TRANSIT|PARKING/.test(upperMerchant)) {
    return "Transport"
  }

  // Lodging
  if (/HOTEL|MOTEL|AIRBNB|BOOKING|HOSTEL|INN|RESORT/.test(upperMerchant)) {
    return "Lodging"
  }

  // Activities
  if (/MUSEUM|TOUR|TICKET|CINEMA|THEATER|PARK|ZOO|AQUARIUM/.test(upperMerchant)) {
    return "Activities"
  }

  // No "Shopping" category exists in app schema; omit if not matched above

  // Health
  if (/PHARMACY|CHEMIST|MEDICAL|CLINIC|HOSPITAL|DOCTOR/.test(upperMerchant)) {
    return "Health"
  }

  return null
}

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
  suggestedCountry?: string
  suggestedCategory?: string
}

interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    )
  }

  // Get user with entitlement fields
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      isAdmin: true,
      plan: true,
      receiptScansUsed: true,
      receiptScansResetAt: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: { code: "USER_NOT_FOUND", message: "User not found" } },
      { status: 404 }
    )
  }

  // Check entitlements
  const entitlementCheck = checkReceiptScanEntitlement(user)
  
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.reason === "no_access") {
      return NextResponse.json(
        { 
          error: { 
            code: "NO_ACCESS", 
            message: "Receipt scanning requires Plus or Pro plan",
            upgradeRequired: true,
          } 
        },
        { status: 403 }
      )
    }
    
    if (entitlementCheck.reason === "limit_reached") {
      return NextResponse.json(
        { 
          error: { 
            code: "LIMIT_REACHED", 
            message: `You've used all ${entitlementCheck.limit} receipt scans for this year`,
            limit: entitlementCheck.limit,
            upgradeRequired: true,
          } 
        },
        { status: 403 }
      )
    }
  }

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === "") {
    console.error("[Receipt] OPENAI_API_KEY not configured")
    return NextResponse.json(
      { error: { code: "MISSING_OPENAI_API_KEY", message: "OPENAI_API_KEY is not set" } },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("image")

    // Validate file exists
    if (!file || !(file instanceof File)) {
      console.error("[Receipt] No valid file provided")
      return NextResponse.json(
        { error: { code: "NO_FILE", message: "No image file provided" } },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("[Receipt] Invalid file type:", file.type)
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: "Only JPEG and PNG images are accepted" } },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error("[Receipt] File too large:", file.size)
      return NextResponse.json(
        { error: { code: "FILE_TOO_LARGE", message: `File size exceeds 10MB limit` } },
        { status: 400 }
      )
    }

    console.log(`[Receipt] Processing: ${file.type}, ${file.size} bytes`)

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      console.error("[Receipt] Empty file buffer")
      return NextResponse.json(
        { error: { code: "EMPTY_FILE", message: "File is empty" } },
        { status: 400 }
      )
    }

    // Build data URL
    const mimeType = file.type?.startsWith("image/") ? file.type : "image/jpeg"
    const base64Image = buffer.toString("base64")
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    console.log(`[Receipt] Calling OpenAI vision API...`)

    // Call OpenAI with vision-capable model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract key information. Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "amount": <number or null>,
  "currency": "<3-letter ISO code or null>",
  "date": "<YYYY-MM-DD or null>",
  "merchant": "<merchant name or null>",
  "confidence": {
    "amount": <0.0-1.0>,
    "currency": <0.0-1.0>,
    "date": <0.0-1.0>,
    "merchant": <0.0-1.0>
  }
}

Instructions:
- amount: Extract the TOTAL/FINAL amount to pay (look for keywords: TOTAL, AMOUNT DUE, GRAND TOTAL, BALANCE DUE, TO PAY, סה״כ, לתשלום). Return as number.
- currency: Return 3-letter ISO code (USD, EUR, GBP, AUD, ILS, CAD, etc.). Infer from symbols: $ with AU context = AUD, ₪ = ILS, € = EUR, £ = GBP.
- date: Extract transaction date, normalize to YYYY-MM-DD format.
- merchant: Extract merchant/store name from top of receipt (clean, short name).
- confidence: Your confidence for each field (0=not found, 0.5=uncertain, 1.0=certain).

Return ONLY the JSON object, nothing else.`
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
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
      console.error(`[Receipt] OpenAI API error: ${response.status}`, errorText.substring(0, 300))
      return NextResponse.json(
        { error: { code: "API_ERROR", message: `OpenAI API returned ${response.status}` } },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[Receipt] Empty response from OpenAI", data)
      return NextResponse.json(
        { error: { code: "EXTRACTION_EMPTY", message: "No data extracted from image" } },
        { status: 502 }
      )
    }

    console.log("[Receipt] Raw response:", content.substring(0, 500))

    // Parse JSON with fallback for markdown-wrapped responses
    let result: ExtractionResult
    try {
      // Clean markdown code blocks if present
      const cleanContent = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim()
      
      const parsed = JSON.parse(cleanContent)

      // Validate required structure
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Response is not an object")
      }

      // Build validated result
      result = {
        amount: typeof parsed.amount === "number" && isFinite(parsed.amount) && parsed.amount > 0 
          ? parsed.amount 
          : null,
        currency: typeof parsed.currency === "string" && parsed.currency.length === 3 
          ? parsed.currency.toUpperCase() 
          : null,
        date: typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) 
          ? parsed.date 
          : null,
        merchant: typeof parsed.merchant === "string" && parsed.merchant.trim().length > 0 
          ? parsed.merchant.trim() 
          : null,
        confidence: {
          amount: typeof parsed.confidence?.amount === "number" ? parsed.confidence.amount : 0,
          currency: typeof parsed.confidence?.currency === "number" ? parsed.confidence.currency : 0,
          date: typeof parsed.confidence?.date === "number" ? parsed.confidence.date : 0,
          merchant: typeof parsed.confidence?.merchant === "number" ? parsed.confidence.merchant : 0,
        }
      }

      // Add suggestions based on extracted data
      const suggestedCountry = suggestCountry(result.currency, result.merchant)
      const suggestedCategory = suggestCategory(result.merchant)
      
      if (suggestedCountry) {
        result.suggestedCountry = suggestedCountry
      }
      if (suggestedCategory) {
        result.suggestedCategory = suggestedCategory
      }

      console.log("[Receipt] Parsed result:", {
        amount: result.amount,
        currency: result.currency,
        date: result.date,
        merchant: result.merchant?.substring(0, 30),
        confidence: result.confidence,
        suggestedCountry: result.suggestedCountry,
        suggestedCategory: result.suggestedCategory,
      })

      // Check if we got at least amount and currency (minimum viable extraction)
      if (!result.amount || !result.currency) {
        console.error("[Receipt] Missing critical fields (amount or currency)")
        return NextResponse.json(
          { error: { code: "EXTRACTION_INCOMPLETE", message: "Could not extract amount and currency from receipt" } },
          { status: 502 }
        )
      }

      // Increment usage count (successful scan)
      const newUsageCount = incrementReceiptScanUsage(user)
      if (newUsageCount !== user.receiptScansUsed) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            receiptScansUsed: newUsageCount,
            receiptScansResetAt: user.receiptScansResetAt || new Date(),
          },
        })
      }

      return NextResponse.json(result, { status: 200 })
    } catch (parseError) {
      console.error("[Receipt] JSON parse error:", parseError, "Content:", content.substring(0, 300))
      return NextResponse.json(
        { error: { code: "EXTRACTION_INVALID", message: "Failed to parse extraction result" } },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error("[Receipt] Unexpected error:", {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Internal error during receipt processing" } },
      { status: 500 }
    )
  }
}
