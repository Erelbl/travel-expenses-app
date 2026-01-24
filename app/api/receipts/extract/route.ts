import { NextRequest, NextResponse } from "next/server"
import { parseReceiptText } from "@/lib/receipts/parseReceiptText"

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
  debugText?: string // Dev only
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

async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured")
  }

  const base64Image = buffer.toString("base64")
  const dataUrl = `data:${mimeType};base64,${base64Image}`

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
            {
              type: "text",
              text: "Extract all visible text from this receipt image exactly as plain text. Return ONLY the text you see, preserving line breaks. No commentary, no analysis, just the raw text."
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}`)
  }

  const data = await response.json()
  const extractedText = data.choices?.[0]?.message?.content || ""
  
  return extractedText.trim()
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

    console.log(`[Receipt] Processing: ${file.type}, ${file.size} bytes`)

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text via OCR
    let extractedText: string
    try {
      extractedText = await extractTextFromImage(buffer, file.type)
      
      if (!extractedText) {
        console.error("[Receipt] OCR returned empty text")
        return NextResponse.json(
          createErrorResponse("EXTRACTION_EMPTY", "Could not extract text from image"),
          { status: 200 }
        )
      }

      console.log(`[Receipt] Extracted text length: ${extractedText.length} chars`)
    } catch (error) {
      console.error("[Receipt] OCR error:", {
        code: "OCR_FAILED",
        message: error instanceof Error ? error.message : String(error),
        fileType: file.type,
        size: file.size,
      })
      return NextResponse.json(
        createErrorResponse("OCR_FAILED", "Failed to extract text from image"),
        { status: 200 }
      )
    }

    // Parse extracted text
    const parsed = parseReceiptText(extractedText)

    console.log("[Receipt] Parsed result:", {
      amount: parsed.amount,
      currency: parsed.currency,
      date: parsed.date,
      merchant: parsed.merchant?.substring(0, 30),
      confidence: parsed.confidence,
    })

    // Build response
    const result: ExtractionResult = {
      amount: parsed.amount,
      currency: parsed.currency,
      date: parsed.date,
      merchant: parsed.merchant,
      confidence: parsed.confidence,
    }

    // Add debugText in development only
    if (process.env.NODE_ENV === "development") {
      result.debugText = extractedText.slice(0, 4000)
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[Receipt] Unexpected error:", {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      createErrorResponse("UNKNOWN_ERROR", "Internal error during receipt processing"),
      { status: 200 }
    )
  }
}
