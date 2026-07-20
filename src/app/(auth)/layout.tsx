import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <main id="main-content" className="w-full max-w-sm">{children}</main>
      <footer className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <Link href="/risk-disclaimer" className="hover:text-foreground transition-colors">Avertissement risque</Link>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} NeverBrokeAgain</p>
      </footer>
    </div>
  )
}
