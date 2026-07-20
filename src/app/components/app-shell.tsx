import { Sidebar } from "@nba/app/components/sidebar"
import { MobileBottomNav } from "@nba/app/components/mobile-bottom-nav"
import { MobileMenu } from "@nba/app/components/mobile-menu"
import { ErrorBoundary } from "@nba/app/components/error-boundary"
import { MessagingUnreadProvider } from "@nba/lib/messaging-unread"
import { CommandPaletteProvider } from "@nba/components/command-palette"
import { type NavSpace, type UserRole } from "@nba/config/navigation"

interface AppShellProps {
  space: NavSpace
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: UserRole
  }
  desktopHeader: React.ReactNode
  mobileHeader: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ space, user, desktopHeader, mobileHeader, children }: AppShellProps) {
  return (
    <MessagingUnreadProvider>
      <CommandPaletteProvider>
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Sidebar space={space} user={user} />

          <div className="flex flex-1 flex-col overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            {desktopHeader}
            {mobileHeader}

            <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>

          <MobileBottomNav space={space} user={user} />
        </div>
      </CommandPaletteProvider>
    </MessagingUnreadProvider>
  )
}
