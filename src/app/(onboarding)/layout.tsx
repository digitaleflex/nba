export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col noise">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  )
}
