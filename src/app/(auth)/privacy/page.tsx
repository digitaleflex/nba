import { Card, CardContent, Badge } from "@nba/design-system"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Politique de confidentialité</h1>
        </div>
        <Badge variant="outline" className="ml-2 text-[10px]">Dernière mise à jour : juillet 2026</Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Responsable du traitement</h2>
            <p className="text-muted-foreground">
              NeverBrokeAgain (NBA) est responsable du traitement de vos données personnelles
              collectées via la plateforme accessible à l&apos;adresse
              <span className="font-mono text-foreground"> access.signauxx.com</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Données collectées</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Données d&apos;inscription :</strong> nom, email, numéro WhatsApp</li>
              <li><strong className="text-foreground">Données de vérification (KYC) :</strong> pièce d&apos;identité, vidéo de vérification broker</li>
              <li><strong className="text-foreground">Données d&apos;usage :</strong> pages visitées, signaux consultés, interactions</li>
              <li><strong className="text-foreground">Données techniques :</strong> adresse IP, user-agent, appareil</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Finalité du traitement</h2>
            <p className="text-muted-foreground">
              Vos données sont utilisées pour : la gestion de votre compte, la fourniture des signaux
              de trading, la vérification d&apos;identité (KYC), la sécurité de la plateforme, et
              l&apos;amélioration du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Durée de conservation</h2>
            <p className="text-muted-foreground">
              Les documents KYC et vidéos de vérification sont conservés pendant la durée
              nécessaire à la vérification puis supprimés sous 30 jours conformément à nos
              engagements. Les données de compte sont conservées tant que votre compte est actif.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Vos droits</h2>
            <p className="text-muted-foreground">
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
              d&apos;effacement, de portabilité et d&apos;opposition concernant vos données
              personnelles. Pour exercer ces droits, contactez-nous à l&apos;adresse
              <span className="font-mono text-foreground"> privacy@signauxx.com</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Sécurité</h2>
            <p className="text-muted-foreground">
              Vos données sont chiffrées en transit (HTTPS) et au repos. L&apos;accès à votre
              compte est protégé par authentification sécurisée (Better Auth). Les documents
              uploadés sont validés par signature numérique.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
