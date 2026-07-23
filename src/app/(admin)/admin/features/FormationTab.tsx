"use client"
/* eslint-disable react/no-unescaped-entities */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
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
  LayoutDashboard,
  BarChart3,
  LineChart,
  MonitorSmartphone,
  Timer,
  Inbox,
  Users,
  BadgeCheck,
  Landmark,
  BellRing,
  ScrollText,
  Flag,
  Lock,
  Settings2,
  BookOpen,
  ChevronDown,
  Shield,
} from "lucide-react"
import { Term, InfoTooltip } from "../components/info-tooltip"
import { authClient } from "@nba/lib/auth-client"

interface Concept {
  icon: React.ReactNode
  title: string
  body: React.ReactNode
  tags?: string[]
}

interface Section {
  id: string
  icon: React.ReactNode
  title: string
  summary: string
  concepts: Concept[]
  defaultOpen?: boolean
}

export function FormationTab() {
  const { data: session } = authClient.useSession()
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN"

  const sections: Section[] = [
    {
      id: "signaux",
      icon: <Radio className="size-5 text-primary" />,
      title: "Signaux & diffusion",
      summary: "Comment un signal est publié, diffusé en temps réel et suivi.",
      defaultOpen: true,
      concepts: [
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
              Un signal est envoyé par plusieurs voies pour maximiser la chance d'être vu : <b>Email</b> (via Resend), <b>Push</b> (web/app), <b>Telegram</b> et <b>WhatsApp</b>. Chaque canal a son propre suivi de réception.
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
                <span><b>Rebond</b> : email rejeté par le serveur du membre ou signalé comme spam.</span>
              </li>
            </ul>
          ),
          tags: ["SENT", "PENDING", "FAILED", "BOUNCED"],
        },
        {
          icon: <Radio className="size-5 text-primary" />,
          title: "Tableau de bord de diffusion",
          body: (
            <p>
              Dans le détail d'un signal publié, l'admin voit en direct : nombre de destinataires, délivrés, échecs, en attente, et un taux de délivrance par canal. La section <b>Échecs de livraison</b> liste chaque erreur (email + motif) pour le support.
            </p>
          ),
          tags: ["Live", "Support"],
        },
      ],
    },
    {
      id: "acces",
      icon: <Inbox className="size-5 text-primary" />,
      title: "Accès, demandes & abonnements",
      summary: "Gestion des demandes d'accès, des plans et de l'override VIP.",
      concepts: [
        {
          icon: <Inbox className="size-5 text-sky-400" />,
          title: "Demandes d'accès",
          body: (
            <p>
              Un membre demande l'accès à un <Term tip="Un plan est une offre d'abonnement (durée, prix) donnant accès à certains groupes de signaux.">plan</Term>. L'admin l'approuve ou la refuse dans l'onglet <b>Demandes</b>. Une fois <b>APPROUVÉE</b>, le membre reçoit les signaux liés à ce plan jusqu'à expiration.
            </p>
          ),
          tags: ["PENDING", "APPROVED", "REJECTED"],
        },
        {
          icon: <Radio className="size-5 text-amber-400" />,
          title: "Accès exceptionnel (Override)",
          body: (
            <p>
              L'<b>Override</b> est un accès gratuit et exceptionnel qui fait recevoir <b>tous les signaux</b> à un membre, même s'il n'a <b>aucun abonnement</b>. Utile pour un accès VIP ou de test sans souscription.
            </p>
          ),
          tags: ["VIP", "Accès total"],
        },
        {
          icon: <ShieldCheck className="size-5 text-violet-400" />,
          title: "Override & abonnement : la règle",
          body: (
            <p>
              Si le membre a <b>déjà un abonnement</b> actif, l'override est <b>inutile</b> : il a déjà accès à ses plans. Le bouton est alors désactivé, et s'il était activé par erreur il apparaît en <b>« Incohérent »</b> — cliquez pour le remettre à l'état normal. N'activez l'override que pour les membres <b>sans abonnement</b>.
            </p>
          ),
          tags: ["Règle", "Cohérence"],
        },
      ],
    },
    {
      id: "verif",
      icon: <BadgeCheck className="size-5 text-primary" />,
      title: "Vérifications (KYC & Broker)",
      summary: "Validation de l'identité et du compte courtier des membres.",
      concepts: [
        {
          icon: <BadgeCheck className="size-5 text-emerald-400" />,
          title: "KYC — vérification d'identité",
          body: (
            <p>
              <Term tip="KYC = Know Your Customer : procédure légale pour vérifier l'identité d'un client (pièce d'identité, selfie...).">KYC</Term> permet de confirmer l'identité d'un membre via des documents. L'admin examine chaque document et le passe en <b>Vérifié</b> ou <b>Rejeté</b>. C'est une exigence de conformité.
            </p>
          ),
          tags: ["Identité", "Conformité", "Documents"],
        },
        {
          icon: <Landmark className="size-5 text-sky-400" />,
          title: "Vérification Broker",
          body: (
            <p>
              Le membre prouve qu'il possède un compte chez un <Term tip="Broker = courtier : plateforme sur laquelle le membre passe ses trades (ex : IC Markets, Exness).">broker</Term> partenaire. L'admin valide la preuve. Cela peut conditionner l'accès à certains avantages.
            </p>
          ),
          tags: ["Courtier", "Preuve"],
        },
      ],
    },
    {
      id: "membres",
      icon: <Users className="size-5 text-primary" />,
      title: "Membres, utilisateurs & rôles",
      summary: "Comptes, rôles, permissions et différence membres/utilisateurs.",
      concepts: [
        {
          icon: <Users className="size-5 text-sky-400" />,
          title: "Membres vs Utilisateurs",
          body: (
            <p>
              L'onglet <b>Membres</b> liste les comptes « clients » (ceux qui reçoivent des signaux). L'onglet <b>Utilisateurs</b> gère tous les comptes et leurs <Term tip="Rôle : ce qu'un compte a le droit de faire (voir, publier, modérer...).">rôles</Term> — c'est là qu'on nomme un admin ou qu'on suspend un compte.
            </p>
          ),
          tags: ["Comptes", "Suspension"],
        },
        {
          icon: <ShieldCheck className="size-5 text-violet-400" />,
          title: "Rôles & permissions",
          body: (
            <p>
              Chaque compte a un rôle : <b>SUPER_ADMIN</b>, <b>ADMIN</b>, <b>BA</b> (assistant) ou <b>MEMBRE</b>. Les permissions attachées au rôle déterminent l'accès à chaque fonctionnalité. Un membre ne voit que ses propres signaux.
            </p>
          ),
          tags: ["SUPER_ADMIN", "ADMIN", "BA", "MEMBRE"],
        },
        {
          icon: <MonitorSmartphone className="size-5 text-amber-400" />,
          title: "Appareils (Devices)",
          body: (
            <p>
              Chaque connexion enregistre l'<Term tip="Appareil : navigateur / téléphone utilisé pour se connecter. Sert à détecter les accès suspects et le partage de compte.">appareil</Term> du membre. L'admin peut voir les appareils actifs, détecter un partage de compte anormal et gérer la vérification d'appareil.
            </p>
          ),
          tags: ["Sécurité", "Anti-partage"],
        },
      ],
    },
    {
      id: "comm",
      icon: <BellRing className="size-5 text-primary" />,
      title: "Communication (E-mails, Notifications, Messagerie)",
      summary: "Emails transactionnels, réputation d'envoi, notifications et chat.",
      concepts: [
        {
          icon: <Mail className="size-5 text-blue-400" />,
          title: "E-mails & réputation",
          body: (
            <p>
              Les emails partent via <Term tip="Resend : service d'envoi d'emails transactionnels utilisé par l'app.">Resend</Term>. L'onglet <b>E-mails</b> suit la <Term tip="Réputation d'expéditeur : score qui détermine si vos emails arrivent en boîte de réception ou en spam. Trop de rebonds/plaintes = mauvaise réputation.">réputation d'envoi</Term>, les taux de rebond et les plaintes. Une bonne réputation = les emails arrivent bien.
            </p>
          ),
          tags: ["Resend", "Réputation", "Rebonds"],
        },
        {
          icon: <BellRing className="size-5 text-amber-400" />,
          title: "Notifications",
          body: (
            <p>
              Les notifications avertissent le membre d'un événement (nouveau signal, message...). Elles peuvent être <b>in-app</b>, <b>push</b>, <b>email</b>. Chaque envoi a un statut de livraison suivi individuellement.
            </p>
          ),
          tags: ["In-app", "Push", "Temps réel"],
        },
        {
          icon: <MessageSquare className="size-5 text-emerald-400" />,
          title: "Messagerie (chat admin ↔ membre)",
          body: (
            <p>
              Un système de messagerie type Messenger permet à l'admin et au membre d'échanger en direct (temps réel via WebSocket). Les messages peuvent contenir des pièces jointes, réactions et être signalés.
            </p>
          ),
          tags: ["Chat", "Temps réel", "Pièces jointes"],
        },
      ],
    },
    {
      id: "audit",
      icon: <ScrollText className="size-5 text-primary" />,
      title: "Audit, modération & sécurité",
      summary: "Traçabilité des actions, modération des messages et protections.",
      concepts: [
        {
          icon: <ScrollText className="size-5 text-sky-400" />,
          title: "Journal d'audit (Audit log)",
          body: (
            <p>
              Chaque action sensible (publier, supprimer, changer un rôle...) est enregistrée dans le <Term tip="Journal d'audit : historique inviolable de qui a fait quoi et quand. Sert de preuve en cas de litige.">journal d'audit</Term>. Il inclut une <Term tip="Chaînage par hash : chaque entrée contient l'empreinte de la précédente, rendant toute falsification détectable (comme une blockchain simplifiée).">intégrité par hash</Term> pour détecter toute falsification.
            </p>
          ),
          tags: ["Traçabilité", "Intégrité", "Preuve"],
        },
        {
          icon: <Flag className="size-5 text-rose-400" />,
          title: "Modération",
          body: (
            <p>
              Les messages signalés par les membres remontent dans l'onglet <b>Modération</b>. L'admin peut examiner, masquer ou sanctionner. Objectif : garder les échanges sains.
            </p>
          ),
          tags: ["Signalements", "Messages"],
        },
        {
          icon: <Lock className="size-5 text-violet-400" />,
          title: "Sécurité",
          body: (
            <p>
              Regroupe les protections : vérification d'appareil, détection d'accès suspects, sessions actives, et paramètres de durcissement. L'admin surveille ici les événements de sécurité.
            </p>
          ),
          tags: ["Sessions", "Protection"],
        },
      ],
    },
    {
      id: "pilotage",
      icon: <LayoutDashboard className="size-5 text-primary" />,
      title: "Pilotage (Dashboard, Stats, Analytics, Crons)",
      summary: "Vue d'ensemble, mesures d'activité et tâches automatiques.",
      concepts: [
        {
          icon: <LayoutDashboard className="size-5 text-sky-400" />,
          title: "Tableau de bord",
          body: (
            <p>
              Vue synthétique de l'état de la plateforme : membres actifs, demandes en attente, derniers signaux, alertes. Le point d'entrée pour voir « ce qui se passe maintenant ».
            </p>
          ),
          tags: ["Vue d'ensemble"],
        },
        {
          icon: <BarChart3 className="size-5 text-emerald-400" />,
          title: "Statistiques & Analytics",
          body: (
            <p>
              <b>Statistiques</b> = chiffres clés (membres, signaux, revenus). <b>Analytics</b> = analyse plus fine des tendances et comportements (croissance, engagement). Servent à décider.
            </p>
          ),
          tags: ["KPIs", "Tendances"],
        },
        {
          icon: <Timer className="size-5 text-amber-400" />,
          title: "Cron Jobs (tâches automatiques)",
          body: (
            <p>
              Un <Term tip="Cron job : tâche planifiée qui s'exécute automatiquement à heure fixe (ex : chaque lundi à 9h).">cron job</Term> exécute des tâches sans intervention : nettoyage des accès expirés, rapport hebdomadaire du journal, etc. L'onglet <b>Cron Jobs</b> montre leur statut et dernière exécution.
            </p>
          ),
          tags: ["Planifié", "Automatique"],
        },
      ],
    },
    {
      id: "journal",
      icon: <LineChart className="size-5 text-primary" />,
      title: "Journal de trading",
      summary: "Suivi des trades des membres et rapport de performance.",
      concepts: [
        {
          icon: <LineChart className="size-5 text-sky-400" />,
          title: "Journal & trades",
          body: (
            <p>
              Le membre enregistre ses <Term tip="Trade : une opération d'achat/vente. Le journal note l'entrée, la sortie, le résultat (gain/perte) et l'état d'esprit.">trades</Term> (paire, direction, entrée/sortie, P&L, émotion). L'app calcule les statistiques de performance et les séries (streaks).
            </p>
          ),
          tags: ["Trades", "P&L", "Psychologie"],
        },
        {
          icon: <Mail className="size-5 text-emerald-400" />,
          title: "Rapport hebdomadaire",
          body: (
            <p>
              Un cron envoie chaque lundi un email récapitulatif au membre : nombre de trades, taux de réussite, gains/pertes de la semaine. Automatisé, aucune action manuelle requise.
            </p>
          ),
          tags: ["Automatique", "Email", "Lundi 9h"],
        },
      ],
    },
    {
      id: "params",
      icon: <Settings2 className="size-5 text-primary" />,
      title: "Paramètres",
      summary: "Réglages globaux de la plateforme.",
      concepts: [
        {
          icon: <Settings2 className="size-5 text-sky-400" />,
          title: "Paramètres généraux",
          body: (
            <p>
              Configuration globale : plans d'abonnement, options d'envoi, intégrations (Telegram/WhatsApp), et divers réglages. À modifier avec précaution car cela affecte toute la plateforme.
            </p>
          ),
          tags: ["Configuration", "Global"],
        },
      ],
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
            Formation — Fonctionnalités de l'application
            <InfoTooltip content="Guide interne pour comprendre chaque fonctionnalité développée dans l'application, sans jargon technique non expliqué." />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Toutes les fonctionnalités de la plateforme, expliquées simplement. Dépliez une section et survolez les termes soulignés pour une définition.
          </p>
        </div>
      </div>

      {/* Sommaire */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="flex flex-wrap gap-2 py-4">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#formation-${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              {s.icon}
              {s.title}
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Sections repliables */}
      <div className="space-y-3">
        {sections.map((s) => (
          <details
            key={s.id}
            id={`formation-${s.id}`}
            open={s.defaultOpen}
            className="group scroll-mt-20 rounded-xl border border-border/60 bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground truncate">{s.summary}</p>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                {s.concepts.length} {s.concepts.length > 1 ? "notions" : "notion"}
              </Badge>
              <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
            </summary>

            <div className="grid gap-4 border-t border-border/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.concepts.map((c, i) => (
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
          </details>
        ))}
      </div>

      {/* Détail canaux */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            Les canaux de livraison en détail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((ch) => (
              <div key={ch.name} className="flex items-start gap-3 rounded-xl border border-border/50 p-3">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
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

      {/* Note technique */}
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

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 pt-2">
        <BookOpen className="size-3.5" />
        Cette formation évolue avec l'application : chaque nouvelle fonctionnalité y est documentée.
      </p>

      {/* ── Catalogue complet (SUPER_ADMIN uniquement) ── */}
      {isSuperAdmin && <FeatureCatalog />}
    </div>
  )
}

const CRITICALITY = {
  critical: { label: "Critique", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  high: { label: "Important", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  medium: { label: "Confort", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  low: { label: "Bonus", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
} as const

interface FeatureEntry {
  name: string
  desc: string
  impact: string
  level: keyof typeof CRITICALITY
}

function FeatureCatalog() {
  const authCat: FeatureEntry[] = [
    { name: "Connexion email/mdp", desc: "Authentification par email + mot de passe (better-auth)", impact: "Sans login, personne n'accède à la plateforme", level: "critical" },
    { name: "Inscription", desc: "Création de compte avec nom, email, mot de passe (min 10 car.)", impact: "Nouveaux utilisateurs ne peuvent pas rejoindre", level: "critical" },
    { name: "Sessions (cookies 7j)", desc: "Sessions HTTP sécurisées, refresh token toutes les 24h", impact: "Déconnexion forcée, perte de travail en cours", level: "critical" },
    { name: "Limite de sessions", desc: "Max 5 sessions par utilisateur, auto-révocation des plus anciennes", impact: "Sécurité anti-partage de compte", level: "critical" },
    { name: "Mot de passe oublié", desc: "Réinitialisation par email, limité à 3/h par IP", impact: "Utilisateurs bloqués sans accès", level: "critical" },
    { name: "Vérification email", desc: "Email de confirmation envoyé à l'inscription, obligatoire", impact: "Bloque l'accès au dashboard tant que non vérifié", level: "high" },
    { name: "2FA / OTP", desc: "Double authentification par code email (better-auth plugin)", impact: "Sécurité renforcée pour les comptes sensibles", level: "high" },
    { name: "Captcha mathématique", desc: "Défi mathématique anti-bot (TTL 5 min)", impact: "Protection contre les inscriptions automatisées", level: "high" },
    { name: "Rate limiting auth", desc: "Login 5/min, inscription 100/h, reset mdp 3/h", impact: "Protection brute force et abus", level: "high" },
    { name: "Révocation de session", desc: "Révoquer une, toutes, ou toutes sauf la session courante", impact: "Contrôle de sécurité utilisateur", level: "high" },
    { name: "Sessions admin (8h)", desc: "Expiration accélérée des sessions admin (8h au lieu de 7j)", impact: "Sécurité du panel admin", level: "high" },
    { name: "Vérification appareil", desc: "Code email 6 chiffres pour valider un nouvel appareil (TTL 10 min)", impact: "Sécurité anti-intrusion", level: "medium" },
    { name: "Vérification statut connexion", desc: "API pour vérifier si un utilisateur est connecté", impact: "Utilitaire développement", level: "medium" },
    { name: "Middleware auth guard", desc: "Protège /dashboard, /admin, /onboarding contre accès non authentifié", impact: "Sécurité périmétrique", level: "medium" },
  ]

  const dashboardCat: FeatureEntry[] = [
    { name: "Tableau de bord principal", desc: "Hub central : KPIs (PnL, win rate, trades, streak) + actions rapides", impact: "Page d'accueil utilisateur, indisponible = pas d'accès", level: "critical" },
    { name: "Flux de signaux", desc: "Liste des signaux publiés avec lu/non-lu, favoris, archives", impact: "Cœur du produit : les membres ne voient plus leurs signaux", level: "critical" },
    { name: "Journal de trading (CRUD)", desc: "Créer/modifier/supprimer des trades (paire, prix, lot, stop, PnL, émotion)", impact: "Fonctionnalité principale du journal", level: "critical" },
    { name: "Statistiques journal", desc: "PnL agrégé, win rate, ratio R:R, stats par paire/signal", impact: "Indicateurs de performance utilisateur", level: "critical" },
    { name: "Profil utilisateur", desc: "Modifier nom, avatar, email, mot de passe, WhatsApp, pays", impact: "Gestion du compte personnel", level: "high" },
    { name: "Centre de notifications", desc: "Liste des notifications avec lu/non-lu, suppression, tout marquer lu", impact: "Canal de communication principal", level: "high" },
    { name: "Préférences notifications", desc: "Activer/désactiver par catégorie + heures silencieuses + son", impact: "Expérience utilisateur personnalisée", level: "high" },
    { name: "Gestion appareils", desc: "Liste des appareils (confiance, blocage), renommer, révoquer", impact: "Sécurité du compte utilisateur", level: "high" },
    { name: "Sessions de trading", desc: "Grouper les trades en sessions, réflexions quotidiennes", impact: "Organisation du journal de trading", level: "high" },
    { name: "Messagerie", desc: "Chat temps réel admin↔membre, pièces jointes, réactions, citations", impact: "Support client en direct", level: "high" },
    { name: "Abonnements", desc: "Voir le plan actif, ses limites, changer de plan", impact: "Monétisation de la plateforme", level: "medium" },
    { name: "Tickets support", desc: "Soumettre une demande d'aide avec pièces jointes (5/h max)", impact: "Service client", level: "medium" },
    { name: "Statut onboarding", desc: "Progression dans les étapes d'onboarding", impact: "Visibilité du parcours utilisateur", level: "medium" },
    { name: "Suppression de compte", desc: "Soft-delete (anonymisation) ou hard-delete (purge)", impact: "Conformité GDPR / droit à l'oubli", level: "medium" },
    { name: "Export données", desc: "Export GDPR de toutes les données utilisateur", impact: "Conformité légale", level: "medium" },
    { name: "Vérification KYC/Broker", desc: "Voir le statut des vérifications d'identité et broker", impact: "Suivi onboarding", level: "medium" },
    { name: "Sons notification", desc: "16 sons sélectionnables via Howler.js", impact: "Confort utilisateur", level: "low" },
    { name: "Analytics (PostHog)", desc: "Tracking événements : guides, trades, coach, missions", impact: "Mesure d'engagement", level: "low" },
    { name: "Coach IA (client)", desc: "Analyse des patterns de trade : streaks, avertissements", impact: "Assistant pédagogique", level: "low" },
    { name: "Visites guidées", desc: "Tutoriels Driver.js : bienvenue, 1er trade, stats, réflexions", impact: "Onboarding des nouveaux utilisateurs", level: "low" },
  ]

  const onboardingCat: FeatureEntry[] = [
    { name: "Machine d'état onboarding", desc: "4 étapes : email (20%), KYC (40%), broker (40%), révision → ACTIF", impact: "Bloque l'accès si non complété", level: "critical" },
    { name: "Profil onboarding", desc: "Collecte nom, téléphone, pays, WhatsApp", impact: "Complétion du profil utilisateur", level: "critical" },
    { name: "Upload documents KYC", desc: "Dépôt pièce d'identité recto/verso (stockage S3)", impact: "Vérification d'identité obligatoire", level: "critical" },
    { name: "Vérification Broker", desc: "Soumission vidéo de vérification compte courtier", impact: "Validation broker obligatoire", level: "critical" },
    { name: "OTP vérification email", desc: "Code 6 chiffres envoyé par email (rate limit 3/min)", impact: "Validation de l'email", level: "high" },
    { name: "État onboarding", desc: "API pour consulter la progression", impact: "Visibilité du parcours", level: "high" },
    { name: "Emails onboarding", desc: "Confirmation par email à chaque étape complétée", impact: "Communication avec l'utilisateur", level: "high" },
  ]

  const adminCat: FeatureEntry[] = [
    { name: "Dashboard/Tracker admin", desc: "Vue d'ensemble : membres actifs, demandes, KYC, broker, revenus", impact: "Tableau de bord opérationnel", level: "critical" },
    { name: "Gestion signaux (CRUD)", desc: "Créer/modifier/supprimer/publier/dupliquer des signaux avec audience ciblée", impact: "Cœur du métier admin", level: "critical" },
    { name: "Distribution signaux", desc: "Diffusion batch vers tous les membres approuvés (email, push, Telegram, WhatsApp)", impact: "Les signaux n'arrivent pas aux membres si cassé", level: "critical" },
    { name: "Gestion membres", desc: "Lister, rechercher, bannir, impersonate, changer rôle, révoquer sessions", impact: "Gestion des utilisateurs", level: "critical" },
    { name: "Revue demandes d'accès", desc: "Approuver/rejeter les demandes d'accès aux plans", impact: "Contrôle des abonnements", level: "critical" },
    { name: "Revue KYC", desc: "Examiner et approuver/rejeter les pièces d'identité", impact: "Validation identité obligatoire", level: "high" },
    { name: "Revue Broker", desc: "Examiner et approuver/rejeter les vérifications broker", impact: "Validation courtier", level: "high" },
    { name: "Anti-fraude", desc: "Monitoring IPs bloquées, suspendre/réactiver comptes, playbooks sécurité", impact: "Protection de la plateforme", level: "high" },
    { name: "Logs d'audit", desc: "Historique horodaté avec intégrité par hash (inviolable)", impact: "Traçabilité légale", level: "high" },
    { name: "Modération messages", desc: "Examiner et traiter les signalements de messages", impact: "Qualité des échanges", level: "high" },
    { name: "Modération email", desc: "Bannir/débannir des adresses email", impact: "Protection anti-abus", level: "high" },
    { name: "Inbox admin", desc: "File d'attente centralisée : KYC, broker, DLQ, anomalies", impact: "Priorisation du travail admin", level: "high" },
    { name: "Gestion plans", desc: "CRUD des plans d'abonnement avec limites (sessions, devices, 2FA)", impact: "Configuration monétisation", level: "medium" },
    { name: "Gestion rôles", desc: "Gérer les rôles (MEMBER, ADMIN, SUPER_ADMIN) et permissions", impact: "Contrôle d'accès", level: "medium" },
    { name: "Cron Jobs", desc: "Voir et déclencher les tâches planifiées", impact: "Maintenance automatisée", level: "medium" },
    { name: "Queue monitoring", desc: "Bull Board : surveiller les files d'attente de jobs", impact: "Diagnostic performance", level: "medium" },
    { name: "Webhooks DLQ", desc: "Gérer la file d'attente des webhooks en échec (replay, abandon)", impact: "Fiabilité des intégrations", level: "medium" },
    { name: "Cache management", desc: "Stats cache (hits/misses), purge par préfixe", impact: "Performance plateforme", level: "medium" },
    { name: "Métriques système", desc: "Santé, variables d'env, statut DB, métriques runtime", impact: "Diagnostic technique", level: "medium" },
    { name: "Circuit breakers", desc: "État des coupe-circuits (push, Telegram, WhatsApp)", impact: "Résilience des intégrations", level: "medium" },
    { name: "Revenus", desc: "Tableau de bord des revenus par plan", impact: "Suivi financier", level: "medium" },
    { name: "Notifications admin", desc: "Envoyer des notifications broadcast aux utilisateurs", impact: "Communication de masse", level: "medium" },
    { name: "Impersonation", desc: "Se connecter en tant qu'un utilisateur pour diagnostiquer", impact: "Support et débogage", level: "medium" },
    { name: "Stats appareils", desc: "Statistiques agrégées des appareils et patterns de fraude", impact: "Analyse sécurité", level: "medium" },
    { name: "Gestion emails", desc: "Voir le statut de livraison Resend, envoyer des emails", impact: "Suivi communication", level: "medium" },
    { name: "Control Room", desc: "Monitoring temps réel : sessions actives, événements récents", impact: "Supervision live", level: "medium" },
    { name: "Recherche globale", desc: "Rechercher membres, signaux, KYC, broker par mot-clé", impact: "Navigation rapide", level: "medium" },
    { name: "Undo actions", desc: "Annuler les dernières actions admin par ID", impact: "Correction d'erreurs", level: "medium" },
    { name: "Nettoyage accès fantômes", desc: "Révoquer les accès des comptes inactifs/supprimés", impact: "Maintenance base de données", level: "medium" },
    { name: "Command palette", desc: "Cmd+K : navigation rapide dans le panel admin", impact: "Productivité admin", level: "low" },
    { name: "Console développeur", desc: "API playground, docs OpenAPI, outils debug", impact: "Développement", level: "low" },
    { name: "Recovery queues", desc: "Gestion des files de reprise pour jobs échoués", impact: "Résilience", level: "low" },
    { name: "Paramètres admin", desc: "Configuration globale clé-valeur", impact: "Réglages plateforme", level: "low" },
    { name: "Support admin", desc: "Répondre aux tickets support des membres", impact: "Service client", level: "low" },
  ]

  const securityCat: FeatureEntry[] = [
    { name: "Risk engine (synchrone)", desc: "Évalue le risque à chaque connexion : IP, sessions, device, 2FA", impact: "Bloque les connexions suspectes en temps réel", level: "critical" },
    { name: "Risk engine (asynchrone)", desc: "Post-login : IP reputation, vélocité, impossible travel", impact: "Détection avancée des menaces", level: "critical" },
    { name: "Security Event Bus", desc: "Bus d'événements central : persiste, publie Redis, alerte email admin", impact: "Colonne vertébrale de la sécurité", level: "critical" },
    { name: "CSRF protection", desc: "Protection anti-CSRF sur toutes les mutations API", impact: "Sécurité des formulaires", level: "critical" },
    { name: "Rate limiting global", desc: "25+ limites par IP/clé avec Redis sliding window", impact: "Protection anti-abus globale", level: "critical" },
    { name: "Rate limit admin", desc: "120 req/min par IP pour les routes admin", impact: "Protection du panel admin", level: "critical" },
    { name: "Abuse detection", desc: "Détection : inscription multiple, brute force, vélocité, Tor, dormant accounts", impact: "Protection anti-fraude", level: "high" },
    { name: "Incident response (12 playbooks)", desc: "Réponses automatisées : credential stuffing, brute force, account takeover, etc.", impact: "Réaction automatique aux menaces", level: "high" },
    { name: "IP reputation", desc: "Résolution IP (VPN/Tor/Proxy/Datacenter) via ipapi.co, cache 1h", impact: "Classification des connexions", level: "high" },
    { name: "Impossible travel", desc: "Détection voyages impossibles (>900 km/h) par Haversine", impact: "Protection anti-intrusion géographique", level: "high" },
    { name: "Security event rules", desc: "5 règles d'alerte : brute force, travel burst, hijack, 2FA, rate burst", impact: "Alertes automatiques", level: "high" },
    { name: "Security notifications", desc: "Alerte utilisateur : nouvel appareil, nouveau pays, login suspect", impact: "Information utilisateur", level: "high" },
    { name: "IP whitelist admin", desc: "Restreindre l'accès admin par IP", impact: "Sécurité périmétrique", level: "high" },
    { name: "Maintenance mode", desc: "Redirection globale vers page de maintenance", impact: "Déploiements sans erreur", level: "high" },
    { name: "Security headers", desc: "X-Content-Type, X-Frame, Referrer-Policy, XSS, Permissions", impact: "Sécurité navigateur", level: "high" },
    { name: "Event catalog (52 types)", desc: "Catalogue de tous les événements de sécurité par catégorie", impact: "Référence sécurité", level: "medium" },
    { name: "Event retention", desc: "Purge automatique selon période de rétention par type (90-730j)", impact: "Gestion stockage", level: "medium" },
    { name: "Device fingerprint", desc: "Hash SHA-256 des signaux navigateur pour identifier les appareils", impact: "Anti-fraude", level: "medium" },
    { name: "Admin alerts (email)", desc: "Alertes email pour événements HIGH/CRITICAL (max 10/h)", impact: "Monitoring sécurité", level: "medium" },
    { name: "Session token rotation", desc: "Rotation programmatique des tokens de session", impact: "Sécurité avancée", level: "medium" },
    { name: "Session geo binding", desc: "Lier une session à une géolocalisation (pays, ville)", impact: "Détection d'anomalies", level: "medium" },
    { name: "Session risk score", desc: "Score de risque (0-100) persisté sur chaque session", impact: "Audit sécurité", level: "medium" },
    { name: "Security daily digest", desc: "Résumé quotidien des événements de sécurité par email", impact: "Veille sécurité", level: "medium" },
  ]

  const infraCat: FeatureEntry[] = [
    { name: "Redis pub/sub", desc: "Bus d'événements temps réel : notifs, messages, typing, signaux", impact: "Toute la communication temps réel", level: "critical" },
    { name: "WebSocket (Socket.IO)", desc: "Serveur WebSocket port 3001, auth par cookie, Redis adapter", impact: "Temps réel utilisateur (notifs, chat, signaux)", level: "critical" },
    { name: "BullMQ queues (5)", desc: "file-cleanup, notification-delivery, signal-distribution, DLQ, recovery", impact: "Tous les jobs asynchrones", level: "critical" },
    { name: "Base de données (Prisma)", desc: "PostgreSQL via Prisma ORM avec retry automatique", impact: "Stockage de toutes les données", level: "critical" },
    { name: "Health check", desc: "Endpoint public : DB, WebSocket, circuits breaker, uptime", impact: "Monitoring de la plateforme", level: "critical" },
    { name: "Webhooks Resend", desc: "Réception événements email (bounce, complain, click, open)", impact: "Suivi délivrabilité email", level: "high" },
    { name: "Dead Letter Queue", desc: "Stockage jobs échoués, retry auto 5 min, escalation après 3 essais", impact: "Aucun job n'est perdu définitivement", level: "high" },
    { name: "Recovery system", desc: "Queue de reprise avec backoff exponentiel (5 essais)", impact: "Résilience des jobs", level: "high" },
    { name: "Cache (Redis TTL)", desc: "Cache avec stats hits/misses, invalidation par préfixe", impact: "Performance de l'application", level: "high" },
    { name: "Circuit breaker", desc: "5 échecs → open, 60s cooldown → half-open → recovery", impact: "Protection des APIs externes", level: "high" },
    { name: "Tracking livraison notifs", desc: "Cycle de vie PENDING → SENT/FAILED par canal avec external ID", impact: "Traçabilité des envois", level: "high" },
    { name: "Rate limiting API", desc: "25+ configurations, sliding window Redis sorted sets", impact: "Protection anti-abus", level: "high" },
    { name: "Cron jobs (10)", desc: "Emails bloqués, réputation, nettoyage, GDPR, digest, backup, keep-alive", impact: "Automatisation de la maintenance", level: "medium" },
    { name: "Bull Board monitor", desc: "Interface visuelle de gestion des queues (port 3002)", impact: "Supervision des jobs", level: "medium" },
    { name: "Sentry", desc: "Tracking d'erreurs avec PII scrubbing (mots de passe, tokens, emails)", impact: "Diagnostic des bugs en production", level: "medium" },
    { name: "Logger structuré", desc: "Logs JSON avec module, niveau, contexte", impact: "Débogage et audit", level: "medium" },
    { name: "Stockage fichiers", desc: "Système de fichiers pluggable (local ou S3/Backblaze B2)", impact: "Stockage KYC et vidéos broker", level: "medium" },
    { name: "Error framework", desc: "AppError typé avec codes, statut HTTP, module, retryable", impact: "Gestion propre des erreurs", level: "medium" },
    { name: "Request ID", desc: "Identifiant unique par requête (x-request-id) pour le tracing", impact: "Traçabilité des requêtes", level: "low" },
    { name: "CORS", desc: "Configuration Cross-Origin pour WebSocket et API", impact: "Sécurité navigateur", level: "low" },
    { name: "UA Parser", desc: "Parse navigateur, OS, device depuis User-Agent", impact: "Fingerprinting", level: "low" },
    { name: "Heures silencieuses", desc: "Plage configurable où les notifications sont supprimées", impact: "Respect utilisateur", level: "low" },
    { name: "Audit hash chain", desc: "Chaîne de hash blockchain-style pour intégrité des logs", impact: "Inviolabilité des audits", level: "low" },
    { name: "Templates email (30+)", desc: "Bibliothèque de templates HTML pour tous les types d'emails", impact: "Communication utilisateur", level: "low" },
    { name: "Public API", desc: "Endpoints publics : plans, health check", impact: "Intégrations externes", level: "low" },
  ]

  const categories = [
    { title: "🔐 Authentification", items: authCat, count: authCat.length },
    { title: "📊 Dashboard Utilisateur", items: dashboardCat, count: dashboardCat.length },
    { title: "🚀 Onboarding", items: onboardingCat, count: onboardingCat.length },
    { title: "🛡️ Panel Admin", items: adminCat, count: adminCat.length },
    { title: "🔒 Sécurité", items: securityCat, count: securityCat.length },
    { title: "⚙️ Infrastructure", items: infraCat, count: infraCat.length },
  ]

  return (
    <div className="space-y-6 pt-8 border-t border-border/60">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Shield className="size-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            Catalogue complet des fonctionnalités
            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">SUPER_ADMIN</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {categories.reduce((s, c) => s + c.count, 0)} fonctionnalités documentées par catégorie et niveau de criticité.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.title} className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{cat.title} <span className="text-muted-foreground font-normal">({cat.count})</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {cat.items.map((f) => {
                const crit = CRITICALITY[f.level]
                return (
                  <details key={f.name} className="group text-xs">
                    <summary className="cursor-pointer flex items-center gap-1.5 py-0.5 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="size-3 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                      <span className="font-medium truncate">{f.name}</span>
                      <span className={`shrink-0 ml-auto text-[10px] px-1.5 py-px rounded ${crit.bg} ${crit.color} border ${crit.border}`}>
                        {crit.label}
                      </span>
                    </summary>
                    <p className="text-muted-foreground leading-relaxed ml-4.5 mt-0.5">{f.desc}</p>
                    <p className="text-[10px] text-amber-400/80 ml-4.5 mt-0.5">
                      Impact si indisponible : {f.impact}
                    </p>
                  </details>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
