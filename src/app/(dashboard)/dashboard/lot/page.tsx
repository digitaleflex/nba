import { Card, CardContent } from "@nba/design-system"
import { LotCalculatorFull } from "@nba/components/lot-calculator"

export default async function LotPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string; sl?: string; tp?: string; pair?: string; direction?: string }>
}) {
  const sp = await searchParams
  const entry = sp.entry ? Number(sp.entry) : undefined
  const sl = sp.sl ? Number(sp.sl) : undefined
  const tp = sp.tp ? Number(sp.tp) : null
  const pair = sp.pair
  const direction = sp.direction === "SELL" ? "SELL" : "BUY"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Calculateur de lot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solde + risque % + entrée + SL → lot suggéré, perte max et R:R.
        </p>
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <LotCalculatorFull
            initialPair={pair}
            initialDirection={direction}
            initialEntry={Number.isFinite(entry) ? entry : undefined}
            initialSl={Number.isFinite(sl) ? sl : undefined}
            initialTp={Number.isFinite(tp ?? NaN) ? tp : null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
