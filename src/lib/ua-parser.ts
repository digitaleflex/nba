export interface ParsedUserAgent {
  deviceType: "desktop" | "mobile" | "tablet" | "unknown"
  brand: string | null
  model: string | null
  os: string | null
  browser: string | null
}

interface Rule {
  test: RegExp
  value: string
}

const OS_RULES: Rule[] = [
  { test: /iPhone|iPad|iPod/i, value: "iOS" },
  { test: /iPad/i, value: "iPadOS" },
  { test: /Mac OS X|Macintosh/i, value: "macOS" },
  { test: /Android/i, value: "Android" },
  { test: /Windows NT 10/i, value: "Windows" },
  { test: /Windows NT/i, value: "Windows" },
  { test: /CrOS/i, value: "ChromeOS" },
  { test: /Linux/i, value: "Linux" },
]

const BROWSER_RULES: Rule[] = [
  { test: /Edg(e|A|iOS)?\//i, value: "Edge" },
  { test: /OPR\/|Opera/i, value: "Opera" },
  { test: /Firefox|FxiOS/i, value: "Firefox" },
  { test: /(?:MSIE |Trident\/.*?rv:)/i, value: "Internet Explorer" },
  { test: /(?:CriOS|FxiOS|EdgiOS)\//i, value: "Safari" },
  { test: /Chrome\//i, value: "Chrome" },
  { test: /Safari\//i, value: "Safari" },
]

const BRAND_RULES: { test: RegExp; value: string; model?: RegExp }[] = [
  { test: /iPhone/i, value: "Apple", model: /iPhone\s*(\d*)/i },
  { test: /iPad/i, value: "Apple", model: /iPad\s*(\d*)/i },
  { test: /iPod/i, value: "Apple" },
  { test: /Macintosh|Mac OS X/i, value: "Apple" },
  { test: /Samsung/i, value: "Samsung", model: /SM-[A-Z0-9]+/i },
  { test: /SM-/i, value: "Samsung", model: /SM-[A-Z0-9]+/i },
  { test: /Galaxy/i, value: "Samsung", model: /Galaxy\s+([A-Za-z0-9\s]+)/i },
  { test: /Pixel/i, value: "Google", model: /Pixel\s*(\d*)/i },
  { test: /Xiaomi|Redmi|POCO/i, value: "Xiaomi", model: /(Redmi|POCO|[A-Za-z0-9]+\s?Pro)/i },
  { test: /HUAWEI|Huawei/i, value: "Huawei", model: /(HUAWEI\s?[A-Za-z0-9]+|[A-Za-z0-9]+\s?Pro)/i },
  { test: /OnePlus/i, value: "OnePlus", model: /OnePlus\s*([A-Za-z0-9\s]+)/i },
  { test: /OPPO/i, value: "OPPO", model: /(OPPO\s?[A-Za-z0-9]+)/i },
  { test: /vivo/i, value: "Vivo" },
  { test: /Realme/i, value: "Realme" },
  { test: /Motorola/i, value: "Motorola" },
  { test: /Nokia/i, value: "Nokia" },
  { test: /Sony/i, value: "Sony" },
  { test: /LG\b/i, value: "LG" },
  { test: /HTC/i, value: "HTC" },
  { test: /Honor/i, value: "Honor" },
  { test: /Tecno/i, value: "Tecno" },
  { test: /Infinix/i, value: "Infinix" },
]

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) {
    return { deviceType: "unknown", brand: null, model: null, os: null, browser: null }
  }

  const os = detect(ua, OS_RULES)
  const browser = detect(ua, BROWSER_RULES)
  const brandMatch = BRAND_RULES.find((r) => r.test.test(ua))

  let brand: string | null = brandMatch?.value ?? null
  let model: string | null = null

  if (brandMatch?.model) {
    const m = ua.match(brandMatch.model)
    if (m) {
      model = m[0].trim()
    }
  }

  // Device type detection
  let deviceType: ParsedUserAgent["deviceType"] = "unknown"
  const isMobileUA = /Mobi|Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)
  const isTabletUA = /Tablet|iPad|Android(?!.*Mobile)|Kindle|Silk/i.test(ua)

  if (/iPad|Tablet|Kindle|Silk/i.test(ua) || (isTabletUA && !isMobileUA)) {
    deviceType = "tablet"
  } else if (isMobileUA) {
    deviceType = "mobile"
  } else if (!/Mobi|Mobile/i.test(ua) && /Windows|Macintosh|Linux x86_64|X11/i.test(ua)) {
    deviceType = "desktop"
  }

  // iPadOS 13+ reports as Macintosh with touch — treat as tablet
  if (/Macintosh/i.test(ua) && /Mobile\/\w+/.test(ua) && /Safari/.test(ua)) {
    deviceType = "tablet"
  }

  return { deviceType, brand, model: model ?? brandMatch?.value ?? null, os, browser }
}

function detect(ua: string, rules: Rule[]): string | null {
  for (const r of rules) {
    if (r.test.test(ua)) return r.value
  }
  return null
}
