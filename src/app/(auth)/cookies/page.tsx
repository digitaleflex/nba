import { Card, CardContent, Badge } from "@nba/design-system"
import { Cookie, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CookiesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Cookie className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Politique des cookies</h1>
        </div>
        <Badge variant="outline" className="ml-2 text-[10px]">Dernière mise à jour : juillet 2026</Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p className="text-muted-foreground">
              Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur,
              mobile, tablette) lors de la visite d&apos;un site. Il permet de reconnaître votre
              appareil lors de vos prochaines visites et de mémoriser certaines informations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Cookies que nous utilisons</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Cookies strictement nécessaires :</strong>{" "}
                <code className="text-foreground">better-auth.session_token</code> (et sa version
                sécurisée <code className="text-foreground">__Secure-better-auth.session_token</code>).
                Ils maintiennent votre session authentifiée et sont indispensables au
                fonctionnement de la plateforme. Ils ne peuvent pas être désactivés.
              </li>
              <li>
                <strong className="text-foreground">Cookies de sécurité :</strong> protection
                contre la fraude et le CSRF, gérés par Better Auth.
              </li>
              <li>
                <strong className="text-foreground">Cookies fonctionnels :</strong> mémorisation
                de vos préférences (langue, affichage).
              </li>
              <li>
                <strong className="text-foreground">Cookies analytiques (optionnels) :</strong>{" "}
                mesure d&apos;audience anonyme pour améliorer le service. Ils ne sont déposés
                qu&apos;avec votre consentement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Gérer vos cookies</h2>
            <p className="text-muted-foreground">
              Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies.
              La désactivation des cookies strictement nécessaires empêchera la connexion à votre
              compte. Pour les cookies analytiques, vous pouvez retirer votre consentement via
              les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Durée de conservation</h2>
            <p className="text-muted-foreground">
              Les cookies de session expirent à la fermeture de la session ou après une période
              d&apos;inactivité. Les cookies analytiques sont conservés au maximum 13 mois.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question sur notre politique des cookies, contactez-nous à{" "}
              <span className="font-mono text-foreground">privacy@signauxx.com</span>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
