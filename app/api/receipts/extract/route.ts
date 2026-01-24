import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic"]

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
  rawHints?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and HEIC are supported." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Convert file to base64 for vision API
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")
    const mimeType = file.type

    // Call OpenAI vision API for receipt extraction
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured")
      return NextResponse.json(
        { 
          amount: null,
          currency: null,
          date: null,
          merchant: null,
          confidence: { amount: 0, currency: 0, date: 0, merchant: 0 }
        },
        { status: 200 }
      )
    }

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
                text: `Extract receipt information from this image. Return ONLY a valid JSON object with these fields:
{
  "amount": number (total amount, null if not found),
  "currency": "ISO code like USD/EUR/ILS/AUD/GBP" (null if not found),
  "date": "YYYY-MM-DD" (null if not found),
  "merchant": "merchant name" (null if not found),
  "confidence": {
    "amount": 0.0-1.0,
    "currency": 0.0-1.0,
    "date": 0.0-1.0,
    "merchant": 0.0-1.0
  }
}

Rules:
- Extract the TOTAL amount (not subtotals)
- Return currency as 3-letter ISO code
- Date must be YYYY-MM-DD format
- Keep merchant name short and clean
- Set confidence based on clarity (0=not found, 0.5=ambiguous, 1.0=clear)
- Return null for fields you cannot find
- Do NOT include any text outside the JSON object`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text())
      return NextResponse.json(
        {
          amount: null,
          currency: null,
          date: null,
          merchant: null,
          confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
        },
        { status: 200 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        {
          amount: null,
          currency: null,
          date: null,
          merchant: null,
          confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
        },
        { status: 200 }
      )
    }

    // Parse JSON response
    let result: ExtractionResult
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim()
      
      result = JSON.parse(cleanContent)
      
      // Validate structure
      if (!result.confidence) {
        result.confidence = { amount: 0, currency: 0, date: 0, merchant: 0 }
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content, parseError)
      return NextResponse.json(
        {
          amount: null,
          currency: null,
          date: null,
          merchant: null,
          confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Receipt extraction error:", error)
    return NextResponse.json(
      {
        amount: null,
        currency: null,
        date: null,
        merchant: null,
        confidence: { amount: 0, currency: 0, date: 0, merchant: 0 },
      },
      { status: 200 }
    )
  }
}

