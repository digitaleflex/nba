"use client"
/* eslint-disable react/no-unescaped-entities */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  cn,
} from "@nba/design-system"
import {
  Radio,
  Zap,
  Mail,
  Bell,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Undo2,
  ShieldCheck,
  UserCog,
  GraduationCap,
  Workflow,
} from "lucide-react"
import { Term, InfoTooltip } from "../components/info-tooltip"

interface Concept {
  icon: React.ReactNode
  title: string
  body: React.ReactNode
  tags?: string[]
}

export function FormationTab() {
  const concepts: Concept[] = [
    {
      icon: <Zap className="size-5 text-amber-400" />,
      title: "Temps réel (real-time)",
      body: (
        <p>
          Dès qu'un <Term tip="Un signal est une recommandation ou analyse de trading envoyée aux membres abonnés à certains groupes.">signal</Term> est publié, il apparaît instantanément sur tous les écrans connectés (admin + membres) sans rafraîchir la page. Cela repose sur une connexion{" "}
          <Term tip="WebSocket : canal de communication permanent entre le navigateur et le serveur, contrairement au HTTP classique qui refait une requête à chaque fois.">WebSocket</Term> et un bus de messages{" "}
          <Term tip="Redis pub/sub : système de diffusion d'événements en temps réel entre les serveurs (très rapide, utilisé par des géants du web).">Redis pub/sub</Term>.
        </p>
      ),
      tags: ["WebSocket", "Socket.IO", "Redis"],
    },
    {
      icon: <Workflow className="size-5 text-sky-400" />,
      title: "Flux de diffusion d'un signal",
      body: (
        <p>
          Publication → le signal est dupliqué vers chaque membre ciblé → une{" "}
          <Term tip="Notification : message poussé vers le membre (dans l'app, par email, push, etc.) pour l'avertir du nouveau signal.">notification</Term> est créée par canal → le membre la reçoit et peut la marquer comme lue. L'admin suit chaque étape en direct dans le tableau de bord de diffusion.
        </p>
      ),
      tags: ["Pipeline", "Abonnements"],
    },
    {
      icon: <Mail className="size-5 text-blue-400" />,
      title: "Canaux de livraison",
      body: (
        <p>
          Un signal est envoyé par plusieurs voies pour maximiser la chance d'être vu. Chaque canal a son propre suivi de réception (voir le tableau de bord de diffusion) :
        </p>
      ),
      tags: ["Email", "Push", "Telegram", "WhatsApp"],
    },
    {
      icon: <CheckCircle2 className="size-5 text-emerald-400" />,
      title: "Statuts de livraison",
      body: (
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
            <span><b>Délivré</b> : bien arrivé chez le membre.</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <span><b>En attente</b> : en cours de traitement, pas encore confirmé.</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="size-4 text-rose-400 mt-0.5 shrink-0" />
            <span><b>Échec</b> : erreur d'envoi (ex : email invalide, quota dépassé).</span>
          </li>
          <li className="flex items-start gap-2">
            <Undo2 className="size-4 text-rose-400 mt-0.5 shrink-0" />
            <span><b>Boîte / Rebond</b> : email rejeté par le serveur du membre ou signalé comme spam.</span>
          </li>
        </ul>
      ),
      tags: ["SENT", "PENDING", "FAILED", "BOUNCED"],
    },
    {
      icon: <ShieldCheck className="size-5 text-violet-400" />,
      title: "Rôles & permissions",
      body: (
        <p>
          L'accès est filtré par <Term tip="Un rôle définit ce qu'un compte a le droit de faire (voir, publier, modérer, etc.).">rôle</Term> : les <b>ADMIN</b> et <b>SUPER_ADMIN</b> peuvent publier des signaux et voient le tableau de bord de diffusion en temps réel ; les membres ne voient que leurs propres signaux.
        </p>
      ),
      tags: ["ADMIN", "SUPER_ADMIN", "MEMBRE"],
    },
    {
      icon: <Radio className="size-5 text-amber-400" />,
      title: "Accès exceptionnel (Override)",
      body: (
        <p>
          L'<b>Override</b> est un accès gratuit et exceptionnel qui fait recevoir <b>tous les signaux</b> à un membre, même s'il n'a <b>aucun abonnement</b>. Il est utile pour donner un accès VIP ou de test sans souscription.
        </p>
      ),
      tags: ["VIP", "Accès total", "Sans abonnement"],
    },
    {
      icon: <Radio className="size-5 text-amber-400" />,
      title: "Override & abonnement : règle",
      body: (
        <p>
          Si le membre a <b>déjà un abonnement</b> actif, l'override est <b>inutile et incohérent</b> : il a déjà accès à tous les signaux de ses plans. Le bouton est alors désactivé, et s'il était activé par erreur il apparaît en <b>« Incohérent »</b> — cliquez dessus pour le remettre à l'état normal. N'activez l'override que pour les membres <b>sans abonnement</b>.
        </p>
      ),
      tags: ["Règle", "Cohérence"],
    },
    {
      icon: <Radio className="size-5 text-primary" />,
      title: "Le tableau de bord de diffusion",
      body: (
        <p>
          Dans le détail d'un signal publié, l'admin voit en direct : nombre de destinataires, délivrés, échecs, en attente, et un taux de délivrance par canal. La section <b>Échecs de livraison</b> liste chaque erreur (email + motif) pour le support.
        </p>
      ),
      tags: ["Live", "Support"],
    },
  ]

  const channels = [
    { icon: <Mail className="size-4" />, name: "Email", desc: "Via Resend. Statut 'délivré' quand le serveur accepte." },
    { icon: <Bell className="size-4" />, name: "Push", desc: "Notification web/app. Échoue si désactivée par le membre." },
    { icon: <MessageSquare className="size-4" />, name: "Telegram", desc: "Chat Telegram du membre (liaison active requise)." },
    { icon: <Smartphone className="size-4" />, name: "WhatsApp", desc: "Message WhatsApp (API, liaison active requise)." },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Formation & Concepts
            <InfoTooltip content="Espace pédagogique pour comprendre le vocabulaire et le fonctionnement de la plateforme, sans jargon technique non expliqué." />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Les principes de la plateforme, expliqués simplement. Survolez les termes soulignés pour une définition.
          </p>
        </div>
      </div>

      {/* Concepts clés */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {concepts.map((c, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                {c.icon}
                <CardTitle className="text-sm">{c.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              {c.body}
              {c.tags && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {c.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] text-muted-foreground">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Détail canaux */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            Les canaux de livraison en détail
          </CardTitle>
          <CardDescription className="text-xs">
            Chaque signal est diffusé simultanément sur ces canaux. Le statut de chacun est suivi indépendamment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((ch) => (
              <div key={ch.name} className="flex items-start gap-3 rounded-xl border border-border/50 p-3">
                <div className={cn("size-8 rounded-lg bg-muted flex items-center justify-center shrink-0")}>
                  {ch.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{ch.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note sécurité / échelle */}
      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCog className="size-4 text-muted-foreground" />
            À quelle échelle ça tourne ?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            L'architecture (WebSocket + Redis pub/sub) est la même que celle utilisée par de très grandes applications. Elle suffit largement pour diffuser un signal à des milliers de membres en moins d'une seconde.
          </p>
          <p>
            On ne crée pas de "serveur par utilisateur" : c'est inutile à notre taille et cela coûterait très cher pour rien. La diffusion est gérée de façon centralisée et sécurisée (chaque membre ne reçoit que ses propres signaux).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
