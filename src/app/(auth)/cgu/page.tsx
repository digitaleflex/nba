import { Card, CardContent, Badge } from "@nba/design-system"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CguPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Conditions Générales d&apos;Utilisation</h1>
        </div>
        <Badge variant="outline" className="ml-2 text-[10px]">CGU</Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Objet</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation
              de la plateforme NeverBrokeAgain (NBA) accessible à l&apos;adresse
              <span className="font-mono text-foreground"> access.signauxx.com</span>. En utilisant
              la plateforme, vous acceptez pleinement les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Inscription et compte</h2>
            <p className="text-muted-foreground">
              L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de son
              inscription. Toute fausse déclaration peut entraîner la suspension immédiate du
              compte. L&apos;utilisateur est responsable de la confidentialité de ses
              identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Services fournis</h2>
            <p className="text-muted-foreground">
              NBA fournit des signaux de trading à titre informatif uniquement. Ces signaux ne
              constituent pas un conseil en investissement. L&apos;utilisateur est seul responsable
              de ses décisions d&apos;investissement et des risques associés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Activation du compte</h2>
            <p className="text-muted-foreground">
              L&apos;inscription nécessite le choix d&apos;un plan et la validation des
              informations fournies. L&apos;accès aux signaux est activé automatiquement après
              création du compte. Conformément à notre Politique de confidentialité, certaines
              fonctionnalités peuvent faire l&apos;objet de vérifications complémentaires.
              Les documents éventuellement fournis sont traités de manière confidentielle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Abonnements et paiements</h2>
            <p className="text-muted-foreground">
              Les conditions d&apos;abonnement (durée, prix, renouvellement) sont présentées
              lors de la souscription. L&apos;utilisateur peut résilier son abonnement à tout
              moment selon les conditions prévues.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              NBA ne saurait être tenu responsable des pertes financières résultant de
              l&apos;utilisation des signaux. La plateforme est fournie &quot;en l&apos;état&quot;
              sans garantie de performance. L&apos;utilisateur reconnaît utiliser le service
              à ses propres risques.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Suspension et résiliation</h2>
            <p className="text-muted-foreground">
              NBA se réserve le droit de suspendre ou résilier tout compte en cas de violation
              des présentes CGU, d&apos;activité frauduleuse, ou de non-paiement. L&apos;utilisateur
              peut également demander la suppression de son compte à tout moment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Modification des CGU</h2>
            <p className="text-muted-foreground">
              NBA se réserve le droit de modifier les présentes CGU. Les utilisateurs seront
              informés de toute modification substantielle par email et via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Suppression de compte et données</h2>
            <p className="text-muted-foreground">
              Vous pouvez à tout moment supprimer votre compte et exporter vos données depuis la
              page <span className="font-mono text-foreground">Mes données</span>. La suppression
              est définitive, anonymise vos informations personnelles et révoque vos sessions
              actives. Elle n&apos;affecte pas les obligations légales de conservation qui
              pourraient s&apos;appliquer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Avertissement sur les risques</h2>
            <p className="text-muted-foreground">
              Les signaux fournis ne constituent pas un conseil en investissement. Veuillez
              consulter notre{" "}
              <a href="/risk-disclaimer" className="text-primary hover:text-primary/80">
                avertissement sur les risques
              </a>{" "}
              avant toute utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant ces CGU, contactez-nous à
              <span className="font-mono text-foreground"> legal@signauxx.com</span>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
