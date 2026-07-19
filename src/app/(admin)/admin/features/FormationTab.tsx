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
} from "lucide-react"
import { Term, InfoTooltip } from "../components/info-tooltip"

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
    </div>
  )
}
