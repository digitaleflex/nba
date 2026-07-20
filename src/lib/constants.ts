export const SUPPORT_EMAIL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL)) ||
  "support@signauxx.com"

export const APP_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) ||
  "http://localhost:3000"
