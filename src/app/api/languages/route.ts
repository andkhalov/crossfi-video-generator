import { NextResponse } from 'next/server'

export async function GET() {
  const languages = [
    { code: "English", name: "English", flag: "🇺🇸" },
    { code: "Portuguese", name: "Português (Brasil)", flag: "🇧🇷" },
    { code: "Vietnamese", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "Spanish", name: "Español", flag: "🇪🇸" },
    { code: "Russian", name: "Русский", flag: "🇷🇺" },
    { code: "Klingon", name: "tlhIngan Hol", flag: "🖖" },
    { code: "Sanskrit", name: "संस्कृतम्", flag: "🕉️" }
  ]

  return NextResponse.json(languages)
}
