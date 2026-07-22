import { NextResponse } from "next/server"
import { generateCaptcha } from "@nba/lib/captcha"

export async function GET() {
  const { question, token } = generateCaptcha()
  return NextResponse.json({ question, token })
}
