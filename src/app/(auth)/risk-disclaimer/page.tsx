import { Card, CardContent, Badge } from "@nba/design-system"
import { TriangleAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function RiskDisclaimerPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-warning" />
          <h1 className="text-2xl font-bold tracking-tight">Avertissement sur les risques</h1>
        </div>
        <Badge variant="outline" className="ml-2 text-[10px]">Informations importantes</Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
          <section className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-foreground font-medium">
              Les signaux fournis par NeverBrokeAgain (NBA) sont une aide à la décision
              informatives et ne constituent en aucun cas un conseil en investissement
              personnalisé au sens de la réglementation en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Nature des signaux</h2>
            <p className="text-muted-foreground">
              NBA génère des signaux de trading (entrées, sorties, niveaux) à partir de modèles
              et d&apos;analyses de marché. Ces informations sont fournies « en l&apos;état »,
              sans garantie de résultat, de rentabilité ou d&apos;exactitude.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Risque de perte</h2>
            <p className="text-muted-foreground">
              Le trading sur instruments financiers (notamment le marché des changes, les CFD et
              les cryptomonnaies) comporte un risque élevé de perte partielle ou totale du capital
              engagé. La forte volatilité peut entraîner des pertes supérieures au dépôt initial.
              Vous ne devez investir que des fonds que vous pouvez vous permettre de perdre.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Responsabilité de l&apos;utilisateur</h2>
            <p className="text-muted-foreground">
              Vous restez seul responsable de vos décisions d&apos;investissement et de la
              gestion de votre compte broker. NBA ne saurait être tenue responsable des pertes
              financières, directes ou indirectes, résultant de l&apos;utilisation des signaux ou
              de l&apos;interprétation erronée des informations fournies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Aucune garantie de performance</h2>
            <p className="text-muted-foreground">
              Les performances passées ne préjugent pas des performances futures. Tout historique
              ou résultat présenté à titre indicatif ne constitue pas un engagement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Cadre réglementaire</h2>
            <p className="text-muted-foreground">
              L&apos;accès aux marchés financiers peut être soumis à des restrictions légales
              selon votre juridiction. Il vous appartient de vérifier que l&apos;utilisation de
              ce service est autorisée dans votre pays de résidence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question, contactez notre équipe à{" "}
              <span className="font-mono text-foreground">support@signauxx.com</span>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
