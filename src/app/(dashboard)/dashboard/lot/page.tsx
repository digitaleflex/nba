import { Card, CardContent } from "@nba/design-system"
import { LotCalculatorFull } from "@nba/components/lot-calculator"

export default function LotPage() {
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
          <LotCalculatorFull />
        </CardContent>
      </Card>
    </div>
  )
}
