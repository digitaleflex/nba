"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

export function ThemeProvider({
  children,
  nonce,
}: {
  children: ReactNode
  /** Nonce CSP — next-themes injecte un <script> inline anti-flash qui doit le porter. */
  nonce?: string
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  )
}
