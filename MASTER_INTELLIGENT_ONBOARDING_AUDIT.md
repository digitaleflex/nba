# MASTER_INTELLIGENT_ONBOARDING_AUDIT

**Application :** NBA — Plateforme de Signaux de Trading  
**Domaine :** signauxx.com  
**Date de l'audit :** Juillet 2026  
**Version cible :** Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / shadcn/ui

---

## 1. SCORES

| Domaine | Score | Niveau |
|---------|-------|--------|
| **UX global** | 72/100 | 🟢 Très bon |
| **Onboarding** | 58/100 | 🟠 Beaucoup de travail |
| **Découverte des fonctionnalités** | 35/100 | 🔄 Refonte recommandée |
| **Accessibilité (WCAG 2.2)** | 45/100 | 🟠 Beaucoup de travail |
| **Simplicité** | 65/100 | 🟡 Bon mais améliorable |

### Détail du Score UX Global (72/100)

| Critère | Score | Raison |
|---------|-------|--------|
| Première impression | 70 | Design soigné, mais pas de tour guidé |
| Navigation | 80 | Sidebar claire, bottom nav mobile |
| Charge cognitive | 65 | Trop de fonctionnalités visibles d'un coup |
| Feedback utilisateur | 75 | Toasts, animations, mais pas de feedback différé |
| Cohérence visuelle | 85 | Design système homogène (shadcn/ui) |
| Performance perçue | 78 | Skeletons, spinner, mais pas d'optimisation des loading states |
| Gestion des erreurs | 70 | Pages 401/403/404/500, mais pas de guidage après erreur |
| États vides | 40 | Peu d'états vides pédagogiques |
| Mobile | 75 | Bottom nav, swipeable rows, bottom sheets |
| Accessibilité | 45 | Peu de labels ARIA, focus visible, navigation clavier |

### Détail du Score Onboarding (58/100)

| Étape | Score | Problème |
|-------|-------|----------|
| Email Verification | 80 | Fonctionnel, OTP clair |
| Profile | 75 | Simple mais pas de guide |
| KYC | 70 | Draft persistant, mais pas de feedback immédiat |
| Broker | 65 | Vidéo, pas de guide d'enregistrement |
| **Attente admin** | **20** | **24h d'attente sans engagement — pire point** |
| Découverte post-onboarding | 30 | Aucun guide après activation |
| Compréhension du produit | 50 | Pas d'explication de la valeur des signaux |

### Détail du Score Découverte (35/100)

| Fonctionnalité | Découverte | Raison |
|----------------|-----------|--------|
| Signal feed | ✅ Oui | Page d'accueil |
| Journal de trading | ⚠️ Partiellement | Visible dans la sidebar, mais profondeur cachée |
| Stats trading | ❌ Non | Découvrable seulement en naviguant dans Journal > Stats |
| Réflexions journalières | ❌ Non | Troisième onglet de Journal |
| Sessions de trading | ❌ Non | Bouton dans la liste des trades |
| Messagerie | ✅ Oui | Badge de notifications non lues |
| Notifications | ✅ Oui | Bell icon + page dédiée |
| Profil | ✅ Oui | Sidebar |
| Abonnement | ⚠️ Partiellement | Sidebar mais peu mis en avant |
| Vérification KYC | ✅ Oui | Sidebar + onboarding |
| Support | ⚠️ Partiellement | Sidebar |
| Export données | ❌ Non | Page Data cachée, pas de lien visible |
| Command palette (admin) | ⚠️ Partiellement | Cmd+K, mais pas documenté |
| Psychologie trading | ❌ Non | Alertes automatiques mais utilisateur ne sait pas qu'elles existent |
| Objectifs trading | ❌ Non | Pas encore implémenté |

---

## 2. CARTOGRAPHIE COMPLÈTE DES PARCOURS

### Parcours 1 : Découverte — Inscription → Activation

```
Landing (redirect /login)
  → Register (5-step wizard)
    → Step 1: Email
    → Step 2: OTP Verification
    → Step 3: Profile (name, phone, country, language)
    → Step 4: KYC (ID document upload)
    → Step 5: Broker (broker name, account, verification video)
  → Onboarding complet
  → Attente admin (24h+)
    → [BLOQUÉ] LockedSignalsView — compte à rebours
    → [ACTION] Lien Telegram support
    → [SORTIE] Possible abandon
  → Admin approuve KYC + Broker
  → Accès activation
  → Dashboard /signals
    → [PREMIÈRE FOIS] Aucun guide, aucun tutorial
```

**Points de friction :**
1. **Attente 24h sans engagement** — Pire expérience. L'utilisateur termine tout, puis attend.
2. **Aucun contenu en attendant** — Rien à lire, rien à apprendre.
3. **Pas de tour guidé au premier login** — L'utilisateur arrive sur une page de signaux vide ou remplie sans comprendre quoi faire.
4. **Pas de "Pourquoi ces fonctionnalités"** — Le journal, la messagerie, les notifications existent mais l'utilisateur ne comprend pas leur valeur.

### Parcours 2 : Premier Signal Reçu

```
Notification push (si activée)
  → Dashboard /signals
    → Nouveau signal avec animation
    → [FRICTION] L'utilisateur voit du contenu markdown, des images
    → [FRICTION] Que faire ? Lire ? Trader ? Archiver ?
  → Actions possibles :
    → Lire → marqué comme lu
    → "J'ai tradé ce signal" → ouvre TradeForm
    → Favori / Archive
```

**Points de friction :**
1. Pas d'explication de l'action "J'ai tradé ce signal"
2. Pas de guidance sur ce qu'est un signal de trading
3. Les filtres (all, unread, today, forex, etc.) ne sont pas expliqués

### Parcours 3 : Premier Trade (Journal)

```
Dashboard /signals
  → Ouvrir un signal
  → Cliquer "J'ai tradé ce signal"
  → TradeForm dialog (~20 champs)
    → [FRICTION] Beaucoup de champs, pas de tooltips
    → [FRICTION] Pas de guide "Comment remplir mon premier trade"
  → Soumettre → toast "Trade enregistré"
  → Journal mis à jour
```

**Points de friction :**
1. 20 champs dans un dialog sans guidance
2. Pas d'explication de PnL, R:R, lot size, spread
3. Pas de suggestion des champs optionnels vs obligatoires
4. Les émotions et la confiance ne sont pas expliquées

### Parcours 4 : Découverte des Statistiques

```
Dashboard /journal
  → Voir la liste des trades
  → [FRICTION] Stats est un onglet (pas mis en avant)
  → Cliquer sur Stats
  → [FRICTION] Beaucoup de chiffres, pas d'explication
  → Win rate, PnL, streaks, max drawdown, expectancy, etc.
  → [ABANDON] L'utilisateur ne comprend pas la valeur
```

**Points de friction :**
1. Pas de guide "Comprendre ses statistiques"
2. Les métriques avancées (expectancy, profit factor) ne sont pas expliquées
3. Pas de recommandation basée sur les stats

### Parcours 5 : Réflexions et Psychologie

```
Dashboard /journal
  → Onglet Réflexions (troisième onglet, peu visible)
  → Noter sa journée (1-10)
  → Choisir une émotion
  → Écrire une note
  → [FRICTION] L'utilisateur ne sait pas pourquoi faire ça
```

**Points de friction :**
1. Les alertes psychologiques (revenge trade, overtrading) arrivent sans contexte
2. L'utilisateur ne comprend pas le lien entre réflexions et performance
3. Pas de guide "Pourquoi tenir un journal de trading"

### Parcours 6 : Messagerie

```
Dashboard /messages
  → [FRICTION] Liste vide si aucun admin n'a contacté
  → Cliquer "Nouvelle conversation"
  → Chercher un admin
  → Envoyer un message
```

**Points de friction :**
1. Pas d'explication "Contactez le support ou votre coach"
2. L'utilisateur ne sait pas à quoi sert la messagerie
3. Pas de suggestion "Besoin d'aide ?"

---

## 3. FONCTIONNALITÉS INVISIBLES

| # | Fonctionnalité | Page | Problème | Solution |
|---|---------------|------|----------|----------|
| F1 | Export des données | `/dashboard/data` | Page cachée, accessible seulement par URL directe | Ajouter lien dans les paramètres → compte |
| F2 | Session de trading | Journal > bouton "Start Session" | Bouton discret au-dessus de la liste | Bannière persistante, notification push quand trade sans session |
| F3 | Alertes psychologiques | Automatiques | L'utilisateur reçoit une notification mais ne comprend pas d'où ça vient | Page dédiée "Psychologie", explication contextuelle |
| F4 | Discipline streak | Journal > stats | Pas de visibilité sur la série de jours disciplinés | Badge dans le tableau de bord, notification de streak |
| F5 | Command palette (admin) | Admin | Cmd+K non documenté | Tooltip, guide Driver.js, raccourci visible |
| F6 | Templates de signaux (admin) | Admin > Signals | Pas de lien clair vers les templates | Onglet ou section dédiée |
| F7 | Versions de signaux (admin) | Admin > Signal detail | Pas de visibilité sur l'historique des versions | Timeline visuelle, diff |
| F8 | Intégrité des logs d'audit | Admin > Audit | Fonctionnalité critique mais invisible | Badge "Intégrité vérifiée" |
| F9 | Files d'attente (admin) | Admin > Queues | Page technique, pas de lien dans le dashboard admin | Widget dans le dashboard admin |
| F10 | Notifications push | Dashboard > Notifications | L'utilisateur doit naviguer vers notifications pour activer | Prompt contextuel au premier signal |
| F11 | Préférences de notifications par type | Dashboard > Notifications | Caché dans l'écran des notifications | Suggestion contextuelle "Vous préférez ne recevoir que les signaux ?" |
| F12 | Test de son de notification | Dashboard > Notifications | Fonctionnalité cachée dans un menu | Bouton plus visible |

---

## 4. ÉTATS VIDES — ANALYSE ET CORRECTIONS

### État Vide : Signaux (première connexion)

**Actuel :** Aucun état vide défini — la page affiche soit les signaux soit un overlay "pas d'accès".

**Recommandé :**
```tsx
<EmptyState
  icon="Radio"
  title="Bienvenue sur NBA !"
  description="Vos signaux de trading apparaîtront ici dès qu'ils seront publiés. En attendant, explorez votre journal de trading pour suivre vos performances."
  action={{ label: "Découvrir le Journal", href: "/dashboard/journal" }}
/>
```

### État Vide : Journal (aucun trade)

**Actuel :** Aucun état vide.

**Recommandé :**
```tsx
<EmptyState
  icon="Notebook"
  title="Votre journal de trading"
  description="Enregistrez vos premiers trades pour suivre votre progression. Chaque trade vous aide à comprendre votre stratégie et à vous améliorer."
  action={{ label: "Créer mon premier trade", onClick: openTradeForm }}
/>
```

### État Vide : Messages (aucune conversation)

**Actuel :** Aucun état vide.

**Recommandé :**
```tsx
<EmptyState
  icon="MessageSquare"
  title="Votre messagerie"
  description="Contactez l'équipe NBA pour toute question. Vous pouvez aussi discuter avec votre coach personnel."
  action={{ label: "Contacter le support", href: "/dashboard/support" }}
/>
```

### État Vide : Réflexions (aucune réflexion)

**Actuel :** Aucun état vide.

**Recommandé :**
```tsx
<EmptyState
  icon="Brain"
  title="Vos réflexions quotidiennes"
  description="Prenez 2 minutes chaque jour pour noter votre état d'esprit. Les traders qui tiennent un journal progressent 3x plus vite."
  action={{ label: "Écrire ma première réflexion", onClick: openReflections }}
/>
```

### État Vide : Notifications (aucune notification)

**Actuel :** Aucun état vide.

**Recommandé :**
```tsx
<EmptyState
  icon="Bell"
  title="Aucune notification"
  description="Vous recevrez des notifications pour les nouveaux signaux, les mises à jour KYC, et les messages."
/>
```

---

## 5. GUIDES DRIVER.JS — SCÉNARIO COMPLET

### Pourquoi Driver.js plutôt que React Joyride ou Shepherd.js ?

| Critère | Driver.js | React Joyride | Shepherd.js |
|---------|-----------|---------------|-------------|
| Bundle size | ~8KB | ~60KB | ~45KB |
| React natif | Manuel | ✅ Oui | Manuel |
| Contrôle précis | ✅ Excellent | ⚠️ Limité | ✅ Bon |
| Overlay dynamique | ✅ Oui | ✅ Oui | ⚠️ Partiel |
| Multi-pages | Manuel | ✅ Intégré | Manuel |
| Accessibilité | ⚠️ Basique | ✅ Bon | ⚠️ Basique |
| Personnalisation | ✅ Totale | ⚠️ Limitée | ✅ Bonne |
| Maintenance | ✅ Active | ⚠️ Ralentie | ⚠️ Modérée |

**Verdict :** Driver.js est le meilleur choix pour NBA car :
1. **Bundle minimal** (8KB) — critique pour LCP et INP
2. **Contrôle total** sur le DOM — s'intègre parfaitement avec shadcn/ui
3. **Overlay précis** pour mettre en valeur un élément spécifique
4. **Facile à wrapper** dans un composant React avec état global

### Guide 1 : "Bienvenue sur NBA" — Premier Dashboard

**Déclencheur :** Premier login après activation du compte  
**Priorité :** 🔴 Critique

| Étape | Cible | Texte | Objectif |
|-------|-------|-------|----------|
| 1 | `.sidebar` ou équivalent | "Bienvenue sur NBA ! 👋 Voici votre tableau de bord. Commençons par découvrir les essentiels." | Présentation générale |
| 2 | `[href="/dashboard/signals"]` | "📡 **Les Signaux** — C'est le cœur de NBA. Vous y trouverez tous les signaux de trading publiés par notre équipe." | Comprendre la valeur principale |
| 3 | Premier signal dans la liste | "Cliquez sur un signal pour lire l'analyse complète. Vous pouvez l'archiver, le mettre en favori, ou enregistrer un trade associé." | Première interaction |
| 4 | `[href="/dashboard/journal"]` | "📓 **Le Journal** — Enregistrez vos trades, suivez vos statistiques, et analysez votre psychologie de trading. C'est votre outil de progression." | Découvrir le journal |
| 5 | `[href="/dashboard/messages"]` | "💬 **La Messagerie** — Discutez avec notre équipe support et vos coachs. Disponible 7j/7." | Découvrir la messagerie |
| 6 | `.notification-bell` | "🔔 **Les Notifications** — Restez informé des nouveaux signaux, des mises à jour et des alertes personnelles." | Découvrir les notifications |
| 7 | `[href="/dashboard/profile"]` | "✅ C'est tout pour commencer ! Explorez chaque section à votre rythme. Besoin d'aide ? Le support est là." | Fin du guide |

### Guide 2 : "Premier Trade" — Journal de Trading

**Déclencheur :** Premier clic sur "J'ai tradé ce signal" OU ouverture du TradeForm  
**Priorité :** 🔴 Critique

| Étape | Cible | Texte | Objectif |
|-------|-------|-------|----------|
| 1 | `.trade-form` | "📝 **Enregistrer un trade** — Remplissez les informations de votre trade pour suivre votre performance." | Présentation du formulaire |
| 2 | `[name="pair"]` | "**Paire** — La paire de devises que vous avez tradée (ex: EURUSD)." | Champ paire |
| 3 | `.direction-buttons` | "**Direction** — Achetez (BUY) si vous pensez que le prix monte, vendez (SELL) si vous pensez qu'il baisse." | Direction |
| 4 | `[name="result"]` | "**Résultat** — Indiquez si vous avez gagné, perdu, ou si le trade est à l'équilibre (BE = Break Even)." | Résultat |
| 5 | `.pnl-display` | "📊 Le **PnL** et le **R:R** sont calculés automatiquement. Ces métriques vous aident à évaluer votre performance." | Métriques |
| 6 | `.mood-selector` | "**Émotion** — Quelle était votre émotion pendant ce trade ? Honnête avec soi-même, c'est la clé du progrès." | Émotion |
| 7 | `.confidence-stars` | "**Confiance** — À quel point étiez-vous confiant ? Sur 5 étoiles. Comparez avec le résultat pour apprendre." | Confiance |
| 8 | `.submit-button` | "Prêt à enregistrer ! Vous pourrez modifier ou supprimer ce trade plus tard." | Finalisation |

### Guide 3 : "Découvrir les Statistiques"

**Déclencheur :** 5ème trade enregistré (détection de masse critique)  
**Priorité :** 🟡 Haute

| Étape | Cible | Texte | Objectif |
|-------|-------|-------|----------|
| 1 | `.stats-tab` | "📈 **Vos Statistiques** — Avec 5 trades, vous avez assez de données pour commencer à analyser votre performance." | Introduction |
| 2 | `.win-rate` | "**Win Rate** — Votre pourcentage de trades gagnants. L'objectif n'est pas d'avoir 100% mais d'être rentable." | Win rate |
| 3 | `.pnl-chart` | "**Évolution du PnL** — Visualisez votre courbe de gains et pertes dans le temps. Une courbe ascendante = progrès !" | PnL chart |
| 4 | `.pair-breakdown` | "**Par Paire** — Voyez quelles paires vous réussissent le mieux. Concentrez-vous sur vos forces." | Analyse par paire |
| 5 | `.mood-breakdown` | "**Par Émotion** — Découvrez comment vos émotions influencent vos résultats. La data ne ment pas." | Analyse émotionnelle |
| 6 | `.psychology-alert` | "🧠 **Psychologie** — Notre moteur d'IA détecte automatiquement les patterns dangereux (revenge trading, overtrading)." | Psychologie |

### Guide 4 : "Admin — Signal Editor"

**Déclencheur :** Première ouverture du SignalEditor  
**Priorité :** 🟢 Moyenne

| Étape | Cible | Texte | Objectif |
|-------|-------|-------|----------|
| 1 | `.signal-editor` | "📣 **Créer un Signal** — Publiez un nouveau signal de trading pour vos membres." | Introduction |
| 2 | `.step-content` | "**Étape 1 : Contenu** — Rédigez votre analyse en markdown. Ajoutez jusqu'à 5 images pour illustrer." | Contenu |
| 3 | `.step-audience` | "**Étape 2 : Audience** — Sélectionnez les plans qui recevront ce signal." | Audience |
| 4 | `.step-schedule` | "**Étape 3 : Planification** — Publiez maintenant ou programmez pour plus tard." | Schedule |
| 5 | `.publish-button` | "🚀 Prêt à publier ! Les notifications seront envoyées automatiquement à tous les membres concernés." | Publication |

### Guide 5 : "Découvrir les Réflexions"

**Déclencheur :** 3ème jour consécutif sans réflexion (détection d'absence)  
**Priorité :** 🟢 Moyenne

| Étape | Cible | Texte | Objectif |
|-------|-------|-------|----------|
| 1 | `.reflections-tab` | "🧘 **Les Réflexions** — Prenez 2 minutes pour noter votre journée. Les traders disciplinaires progressent 3x plus vite." | Introduction |
| 2 | `.rating-selector` | "**Note du jour** — Comment évaluez-vous votre journée de trading ?" | Rating |
| 3 | `.mood-selector` | "**Émotion dominante** — Quelle émotion a marqué votre journée ?" | Mood |
| 4 | `.reflection-note` | "**Note libre** — Écrivez ce qui vous passe par la tête. C'est votre espace personnel." | Note |

---

## 6. ARCHITECTURE DU COACH IA

### Principe

Le Coach IA NBA est un assistant contextuel qui :

- **Observe** les actions de l'utilisateur (trades, réflexions, navigation)
- **Analyse** les patterns (comportementaux, performance, progression)
- **Intervient** au bon moment (feedback, conseil, encouragement)
- **S'adapte** au niveau de l'utilisateur (débutant → expert)

### Architecture Technique

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Driver.js │  │ Tooltips │  │ CoachIA Widget   │  │
│  │ (guides)  │  │ (Floating│  │ (chat bubble)    │  │
│  │           │  │  UI)     │  │                  │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        └──────────────┴─────────────────┘            │
│                        │                             │
│                   Socket.IO                          │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│                    Backend                           │
│  ┌────────────────────────────────────────────────┐ │
│  │         Coach Engine (Edge / API Route)        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │ │
│  │  │ Event    │  │ Pattern  │  │ LLM Provider │ │ │
│  │  │ Router   │→ │ Detector │→ │ (OpenAI /    │ │ │
│  │  │          │  │          │  │  Claude /    │ │ │
│  │  │          │  │          │  │  Gemini)     │ │ │
│  │  └──────────┘  └──────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│                        │                             │
│                   Redis Pub/Sub                      │
│                        │                             │
│  ┌────────────────────────────────────────────────┐ │
│  │          Analytics Store (PostHog / Custom)    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │ │
│  │  │ User     │  │ Feature  │  │ Coach        │ │ │
│  │  │ Actions  │  │ Usage    │  │ Interactions │ │ │
│  │  └──────────┘  └──────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Architecture Technique — Implémentation

#### Provider LLM Agnostic

```typescript
// src/lib/coach/providers/types.ts
export interface CoachProvider {
  generate(prompt: CoachPrompt): Promise<CoachResponse>
}

export type CoachProviderType = "openai" | "claude" | "gemini"

// src/lib/coach/providers/factory.ts
export function createCoachProvider(type: CoachProviderType): CoachProvider {
  switch (type) {
    case "openai": return new OpenAIProvider()
    case "claude": return new ClaudeProvider()
    case "gemini": return new GeminiProvider()
  }
}
```

#### Moteur d'Événements

```typescript
// src/lib/coach/events.ts
export type CoachEvent =
  | { type: "trade.created"; trade: TradeData }
  | { type: "trade.streak"; count: number; result: "win" | "loss" }
  | { type: "reflection.created"; mood: string; rating: number }
  | { type: "stats.milestone"; metric: string; value: number }
  | { type: "psychology.alert"; alert: PsychologyAlert }
  | { type: "session.started" }
  | { type: "session.ended"; trades: number; duration: number }
  | { type: "first.signal.read" }
  | { type: "first.trade.created" }
  | { type: "first.reflection.created" }
  | { type: "onboarding.completed" }
  | { type: "feature.discovered"; feature: string }
  | { type: "user.idle"; daysSinceLastVisit: number }
```

#### Détecteur de Patterns

```typescript
// src/lib/coach/patterns.ts
export interface Pattern {
  name: string
  detect(history: CoachEvent[]): PatternMatch | null
  priority: number
}

export const PATTERNS: Pattern[] = [
  {
    name: "revenge_trading",
    priority: 100,
    detect: (history) => {
      const recent = history.filter(
        e => e.type === "trade.created" && isWithinMinutes(e.timestamp, 60)
      )
      if (recent.length >= 3 && recent.every(e => e.type === "trade.created" && e.trade.result === "LOSS")) {
        return { type: "warning", message: "Vous enchaînez les pertes. Faites une pause." }
      }
      return null
    }
  },
  {
    name: "improving_win_rate",
    priority: 50,
    detect: (history) => {
      // Détecter une amélioration du win rate sur les 10 derniers trades
    }
  },
  {
    name: "first_milestone",
    priority: 80,
    detect: (history) => {
      if (history.some(e => e.type === "trade.created") && history.filter(e => e.type === "trade.created").length === 10) {
        return { type: "celebration", message: "10 trades ! Vous commencez à avoir des données parlantes." }
      }
      return null
    }
  },
]
```

#### Widget Coach IA (Frontend)

```tsx
// src/components/coach-ia.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Sparkles } from "lucide-react"

export function CoachIA() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<CoachMessage[]>([])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 w-80 h-96 bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold">Coach NBA</span>
              <button onClick={() => setOpen(false)} className="ml-auto">
                <X className="size-4" />
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`text-sm p-2 rounded-xl ${m.role === "coach" ? "bg-primary/5 mr-6" : "bg-muted ml-6"}`}>
                  {m.content}
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="p-3 border-t border-border">
              <input
                placeholder="Posez une question à votre coach..."
                className="w-full text-sm bg-muted rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
      >
        <MessageCircle className="size-5" />
      </button>
    </>
  )
}
```

### Moments d'Intervention du Coach IA

| Déclencheur | Type | Message | Timing |
|------------|------|---------|--------|
| Premier trade | 🎉 Célébration | "Félicitations pour votre premier trade ! Chaque trade est une opportunité d'apprendre." | Immédiat |
| 5ème trade | 📊 Analyse | "Vous avez 5 trades. Jetez un œil à vos statistiques pour voir où vous en êtes." | Après enregistrement |
| 10ème trade | 🎯 Milestone | "10 trades ! Vous avez maintenant une base solide pour analyser votre stratégie." | Après enregistrement |
| 3 pertes consécutives | ⚠️ Alerte | "Je remarque 3 pertes d'affilée. C'est souvent le signe d'un tilt. Faites une pause de 30 minutes." | Après 3ème perte |
| 3 victoires consécutives | 💪 Encouragement | "Belle série ! Continuez sur cette lancée. Restez humble et concentré." | Après 3ème win |
| Aucun trade depuis 7 jours | 🔔 Relance | "Ça fait une semaine ! Votre stratégie vous attend. Même un petit trade aide à rester dans le game." | 7 jours d'inactivité |
| Aucune réflexion depuis 3 jours | 🧘 Rappel | "Les réflexions quotidiennes aident à garder un état d'esprit clair. 2 minutes suffisent." | 3 jours d'inactivité |
| Nouvelle fonctionnalité découverte | 🎓 Guide | "Vous venez de découvrir [feature] ! Laissez-moi vous montrer comment en tirer le meilleur." | À la découverte |
| Session de trading terminée | 📋 Bilan | "Session terminée : [X] trades en [Y] minutes. Voulez-vous analyser cette session ?" | Fin de session |

---

## 7. MOTEUR D'ANALYSE COMPORTEMENTALE

### Architecture

```typescript
// src/lib/coach/analytics/types.ts
export type UserProfile =
  | "lost"       // Utilisateur perdu — clique aléatoirement, temps long
  | "beginner"   // Débutant — suit les guides, trades peu
  | "regular"    // Régulier — trade quotidiennement, utilise le journal
  | "expert"     // Expert — utilise toutes les fonctionnalités, stats avancées
  | "hesitant"   // Hésitant — beaucoup de nav, peu d'actions
  | "blocked"    // Bloqué — même action échouée plusieurs fois
  | "churning"   // Risque de départ — inactivité 14+ jours
```

### Critères de Détection

| Profil | Critères | Action |
|--------|----------|--------|
| **lost** | >10 clics sans action complétée, temps >30s sur une page simple | Lancer guide Driver.js de la page actuelle |
| **beginner** | <5 trades, pas de réflexions, pas visité /journal/stats | Suggérer "Découvrir les stats" |
| **regular** | 5-50 trades, réflexions occasionnelles, visite journal 3x/semaine | Coach passif, félicitations aux milestones |
| **expert** | >50 trades, réflexions quotidiennes, utilise tous les filtres, sessions | Coach avancé, alertes psychologiques uniquement |
| **hesitant** | Ouvre le TradeForm mais ne soumet pas (>2min sur le form) | Tooltip "Besoin d'aide pour remplir ce trade ?" |
| **blocked** | Même erreur API 3 fois de suite | Suggérer support, proposer un contournement |
| **churning** | Pas de visite depuis 14 jours | Email de relance personnalisé avec stats récentes |

---

## 8. MISSIONS D'APPRENTISSAGE

### Système de Missions

```typescript
interface Mission {
  id: string
  title: string
  description: string
  icon: string
  steps: MissionStep[]
  xp: number
  badge?: Badge
  prerequisite?: string // mission id requise
}

interface MissionStep {
  id: string
  description: string
  action: string // event à tracker
  completed: boolean
}
```

### Liste des Missions

| # | Mission | Étapes | XP | Prérequis |
|---|---------|--------|----|-----------|
| M1 | **Premier Pas** | Lire son premier signal, Marquer comme lu | 50 XP | — |
| M2 | **Trader en Herbe** | Créer 1 trade, Ajouter 1 tag | 100 XP | M1 |
| M3 | **Journalier** | Écrire 1 réflexion, Noter sa journée | 75 XP | M2 |
| M4 | **Statisticien** | Visiter l'onglet Stats, Comprendre son win rate | 150 XP | M2 |
| M5 | **Trading Série** | 5 trades enregistrés, 3 réflexions | 200 XP | M3 |
| M6 | **Explorateur** | Visiter Messages, Notifications, Profil | 100 XP | M1 |
| M7 | **Session Master** | Démarrer une session, Terminer avec au moins 3 trades | 250 XP | M5 |
| M8 | **Psychologue** | Recevoir une alerte psychologique, Adapter son comportement | 300 XP | M5 |
| M9 | **Discipliné** | 7 jours de streak (trade + réflexion chaque jour) | 500 XP | M5 |
| M10 | **Vétéran** | 50 trades, 30 réflexions, Win rate >55% | 1000 XP | M9 |

### Intégration UI

```tsx
// src/components/missions-panel.tsx
export function MissionsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4" />
          Missions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`size-10 rounded-full flex items-center justify-center ${m.completed ? 'bg-emerald-500/10' : 'bg-muted'}`}>
              {m.completed ? <Check className="size-4 text-emerald-500" /> : <span className="text-sm font-bold text-muted-foreground">{m.xp}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.progress}/{m.total} étapes</p>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(m.progress / m.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

---

## 9. GAMIFICATION

### Recommandations (uniquement ce qui améliore l'apprentissage)

| Élément | Utile ? | Implémentation |
|---------|---------|---------------|
| **XP (points d'expérience)** | ✅ Oui | Gagnés par actions (trade, réflexion, mission) |
| **Niveaux (Levels)** | ✅ Oui | Débloque des fonctionnalités (ex: niveau 3 → stats avancées) |
| **Streaks (séries)** | ✅ Oui | Discipline streak (trade + réflexion chaque jour) ✔️ Existant |
| **Badges** | ⚠️ Partiel | Uniquement pour les milestones majeures (10 trades, 50 trades) |
| **Leaderboard** | ❌ Non | Nocif pour les traders débutants (comparaison sociale) |
| **Récompenses virtuelles** | ❌ Non | Pas de valeur réelle → pas d'impact |
| **Déblocages progressifs** | ✅ Oui | Fonctionnalités révélées avec le niveau (cf. section 10) |
| **Animations de réussite** | ✅ Oui | Confetti Framer Motion aux milestones |

### Niveaux Proposés

| Niveau | XP Requis | Déblocage | 
|--------|-----------|-----------|
| 1 — Débutant | 0 | Accès signaux, trade simple |
| 2 — Apprenti | 200 | Statistiques de base, réflexions |
| 3 — Régulier | 500 | Sessions de trading, alertes psychologiques |
| 4 — Avancé | 1000 | Export données, stats avancées |
| 5 — Expert | 2000 | Coach IA, objectifs personnalisés |
| 6 — Vétéran | 5000 | Templates de signaux, analyse prédictive |

---

## 10. APPRENTISSAGE PROGRESSIF — PLAN DE RÉVÉLATION

| Jour | Fonctionnalités Visibles | Masquées |
|------|------------------------|----------|
| **J1** | Signaux (lecture), Journal (création trade simple), Support | Stats avancées, Sessions, Réflexions, Export |
| **J3** | Réflexions + Statistiques de base (win rate, PnL) | Sessions, Psychologie, Export |
| **J7** | Sessions de trading + Alertes psychologiques | Export, Stats avancées |
| **J14** | Export données + Statistiques avancées (expectancy, profit factor) | — |
| **J30** | Coach IA + Objectifs personnalisés | — |

---

## 11. TOOLTIPS FLOATING UI

### Champs critiques nécessitant un tooltip

| Page | Champ | Tooltip |
|------|-------|---------|
| TradeForm | Lot Size | "Taille de votre position. 0.01 = micro lot (1000 unités)" |
| TradeForm | Spread | "Coût total du spread en pips ou en euros" |
| TradeForm | R:R | "Risk/Reward : combien vous risquez vs combien vous espérez gagner" |
| TradeForm | Émotions | "L'émotion que vous ressentiez pendant le trade. L'honnêteté est la clé." |
| Stats | Expectancy | "Gain moyen par trade sur le long terme. Positif = stratégie gagnante" |
| Stats | Profit Factor | "Gains totaux / Pertes totales. >1 = rentable" |
| Stats | Max Drawdown | "Plus grosse perte depuis le début. Indicateur de risque." |
| Signals | Filtres | "Filtrez les signaux par type, date, ou statut" |
| KYC | Types document | "Carte d'identité, passeport, ou permis de conduire en cours de validité" |
| Broker | Vidéo | "Enregistrez une vidéo de 5-15s montrant votre visage et votre écran de compte" |

### Implémentation Technique

```typescript
// Utilisation du Radix Tooltip existant
// packages/design-system/index.ts exporte déjà Tooltip
```

### Amélioration : Tooltip enrichi avec Floating UI

```tsx
// src/components/enhanced-tooltip.tsx
import { useFloating, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/react"

export function EnhancedTooltip({ children, content, example, video }: EnhancedTooltipProps) {
  const [open, setOpen] = useState(false)
  const arrowRef = useRef(null)

  const { x, y, strategy, refs, middlewareData } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    middleware: [offset(8), flip(), shift(), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  })

  return (
    <>
      <span ref={refs.setReference} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </span>
      {open && (
        <div ref={refs.setFloating} style={{ position: strategy, top: y ?? 0, left: x ?? 0 }} className="z-50 w-64 p-3 rounded-xl bg-popover text-popover-foreground border shadow-xl text-sm">
          <p>{content}</p>
          {example && <p className="text-xs text-muted-foreground mt-1 italic">Ex: {example}</p>}
          <div ref={arrowRef} className="size-2 rotate-45 bg-popover border-l border-t" style={{ position: "absolute", ...middlewareData.arrow }} />
        </div>
      )}
    </>
  )
}
```

---

## 12. ANIMATIONS FRAMER MOTION

### Animations à Ajouter (jamais décoratives, toujours utiles)

| # | Élément | Animation | But | Fichier |
|---|---------|-----------|-----|---------|
| A1 | Nouveau signal dans la feed | `slideInFromRight` + badge "Nouveau" avec pulse | Attirer l'attention sur le contenu frais | signals-view.tsx |
| A2 | Trade sauvegardé | Confetti + checkmark animé (FireConfetti) | Célébration du progrès | trade-form.tsx |
| A3 | Milestone atteinte (10 trades, 50 trades) | Modal avec animation de trophée | Renforcement positif | journal/page.tsx |
| A4 | Changement d'onglet (Journal) | Transition douce du contenu (`AnimatePresence`) | Fluidité de navigation | journal/page.tsx |
| A5 | Notification reçue | Badge qui bounce + son | Feedback immédiat | notification-bell.tsx |
| A6 | Session de trading | Timer qui pulse doucement | Rappel visuel | session-banner.tsx |
| A7 | Premier login post-onboarding | Guide Driver.js avec fade-in progressif | Accueil chaleureux | dashboard/layout.tsx |
| A8 | Reorder des signaux (favoris) | LayoutAnimation | Feedback de l'action | signals-view.tsx |
| A9 | Widget Coach IA | Scale + fade à l'ouverture/fermeture | Transition naturelle | coach-ia.tsx |
| A10 | Tooltip enrichi | Fade + scale avec Floating UI | Apparition élégante | enhanced-tooltip.tsx |
| A11 | Mission complétée | Badge animé + XP counter (+XX) | Récompense visuelle | missions-panel.tsx |
| A12 | Barre de progression onboarding | Gradient animé | Dynamisme | verification/page.tsx |

### Exemple d'Implémentation

```tsx
// Confetti pour célébration de trade
"use client"
import { motion } from "framer-motion"

function Confetti({ onComplete }: { onComplete: () => void }) {
  const particles = Array.from({ length: 20 })

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: "50vw", y: "50vh", scale: 0, opacity: 1 }}
          animate={{
            x: `${20 + Math.random() * 60}vw`,
            y: `${20 + Math.random() * 60}vh`,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: [0, 360],
          }}
          transition={{ duration: 1.5, delay: i * 0.02, ease: "easeOut", onComplete: i === 19 ? onComplete : undefined }}
          className="size-2 rounded-full"
          style={{ background: ["#22c55e", "#3b82f6", "#eab308", "#ec4899", "#a855f7"][i % 5] }}
        />
      ))}
    </div>
  )
}
```

---

## 13. RECOMMANDATIONS FLOATING UI

### Où Floating UI Améliore l'Expérience

| Contexte Actuel | Problème | Solution Floating UI |
|----------------|----------|---------------------|
| Tooltips Radix basiques | Positionnement parfois coupé, pas de flip | `useFloating` avec `flip + shift` |
| Popover des notifications | Position fixe, pas de boundary detection | Floating UI pour auto-ajustement |
| Menu contextuel (signal actions) | Position relative simple | Floating UI avec detection des bords |
| Guide Driver.js overlay | Pas de gestion responsive avancée | Floating UI pour le positionnement des popups du guide |
| Autocomplete command palette | Position parfois hors écran | `autoUpdate` pour suivre le scroll |

---

## 14. ARCHITECTURE DU SYSTÈME D'ANALYTICS

### Recommandation : PostHog (self-hosted ou cloud)

| Critère | PostHog | Mixpanel | Plausible |
|---------|---------|----------|-----------|
| Auto-capture | ✅ Oui | ❌ Non | ❌ Non |
| Feature flags | ✅ Oui | ❌ Non | ❌ Non |
| Session recording | ✅ Oui | ❌ Non | ❌ Non |
| Pricing (scale) | €€ | €€€ | € |
| Self-hosted | ✅ Oui | ❌ Non | ✅ Oui |
| GDPR compliant | ✅ Oui | ✅ Oui | ✅ Oui |

**Choix : PostHog** — Auto-capture réduit le code, feature flags utiles pour l'apprentissage progressif, session recording pour analyser les comportements.

### Événements à Tracker

```typescript
// Navigation
track("page_view", { page: "/dashboard/signals" })
track("navigation.click", { from: "sidebar", to: "/dashboard/journal" })

// Signaux
track("signal.read", { signalId, timeSpent })
track("signal.favorite", { signalId })
track("signal.archive", { signalId })
track("signal.trade_from_signal", { signalId })

// Journal
track("trade.created", { pair, direction, result })
track("trade.deleted")
track("stats.viewed", { period: "30d" })
track("reflection.created")
track("session.start")
track("session.end", { trades, duration })

// Onboarding
track("onboarding.step", { step: "email" })
track("onboarding.completed")
track("onboarding.abandoned", { step: "kyc" })

// Coach
track("coach.guide_started", { guide: "welcome" })
track("coach.guide_completed", { guide: "welcome" })
track("coach.message_sent")
track("coach.helpful", { messageId })
```

---

## 15. ACCESSIBILITÉ WCAG 2.2 — PLAN D'ACTION

| Critère | Statut | Action |
|---------|--------|--------|
| 1.1.1 Contenu non-textuel | ❌ Non | Ajouter `alt` sur toutes les images de signaux et avatars |
| 1.4.3 Contraste minimum | ⚠️ Partiel | Vérifier les textes sur fonds colorés (badges, tags) |
| 1.4.4 Redimensionnement du texte | ⚠️ Partiel | Tester jusqu'à 200%, corriger les overflow |
| 2.1.1 Clavier | ⚠️ Partiel | Ajouter `role` et `tabIndex` sur tous les éléments interactifs |
| 2.4.3 Ordre du focus | ❌ Non | Vérifier l'ordre tab dans le TradeForm et la messagerie |
| 2.4.7 Focus visible | ⚠️ Partiel | Ajouter `focus-visible` ring sur tous les composants |
| 2.5.3 Label dans le nom | ❌ Non | Accessible name pour les icônes seules |
| 3.3.1 Identification des erreurs | ✅ Partiel | Déjà fait dans les formulaires (role="alert") |
| 3.3.2 Étiquettes | ❌ Non | Ajouter des `label` explicites pour tous les champs |
| 4.1.2 Nom, rôle, valeur | ⚠️ Partiel | Vérifier les composants custom (BottomSheet, SwipeableRow) |
| 4.1.3 Messages de statut | ⚠️ Partiel | `aria-live` sur les toasts et notifications |

---

## 16. PERFORMANCE — IMPACT DES RECOMMENDATIONS

| Technologie | Bundle Size | Impact LCP | Impact INP | Lazy Load? |
|-------------|-------------|------------|------------|------------|
| Driver.js | ~8KB gzip | Négligeable | Faible | ✅ Oui (dynamic import) |
| Framer Motion | ~35KB gzip | Modéré (layout animations) | Moyen | ✅ Oui |
| Floating UI | ~6KB gzip | Négligeable | Faible | ✅ Oui |
| PostHog (JS) | ~15KB gzip | Faible (async load) | Faible | ✅ Oui |
| Guide Coach IA | ~5KB | Négligeable | Faible | ✅ Oui (bouton flottant) |
| Confetti animé | ~2KB | Négligeable | Négligeable | ✅ Oui |

**Stratégie :**
- Tous les composants d'onboarding/tour/coach sont chargés en `dynamic(() => import(...), { ssr: false })`
- PostHog chargé en `async` après l'hydratation
- Framer Motion limité aux animations critiques (pas d'animation superflue)
- Driver.js chargé uniquement quand un guide est actif

---

## 17. ROADMAP

### Quick Wins (1-2 jours)

| # | Action | Effort | Impact | Fichiers |
|---|--------|--------|--------|----------|
| QW1 | Ajouter états vides dans Journal, Messages, Réflexions, Notifications | 1h | 🔴 | journal/page.tsx, messages/page.tsx |
| QW2 | Tooltips sur les champs critiques du TradeForm | 2h | 🔴 | trade-form.tsx |
| QW3 | Badge "Nouveau" + animation slideIn sur les nouveaux signaux | 1h | 🟡 | signals-view.tsx |
| QW4 | Ajouter `role="alert"` manquants (déjà commencé) | 30min | 🟡 | (multiple) |
| QW5 | Lien "Découvrir le Journal" dans l'état vide des signaux | 30min | 🟡 | signals-view.tsx |
| QW6 | Ajouter guide Driver.js "Bienvenue sur NBA" (premier login) | 3h | 🔴 | dashboard/layout.tsx |
| QW7 | Aria-labels sur les boutons d'icônes (favori, archive, etc.) | 1h | 🟡 | (multiple) |

### Court Terme (1 semaine)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| CT1 | Guide Driver.js "Premier Trade" | 4h | 🔴 |
| CT2 | Guide Driver.js "Découvrir les Statistiques" (déclenché à 5 trades) | 3h | 🔴 |
| CT3 | Widget Coach IA basique (messages pré-écrits, pas d'IA générative) | 8h | 🔴 |
| CT4 | Missions J1-J6 (Premier Pas → Explorateur) | 6h | 🟡 |
| CT5 | Animations Framer Motion (A1-A6) | 4h | 🟡 |
| CT6 | PostHog setup + événements de base | 3h | 🟡 |
| CT7 | Focus visible + navigation clavier (TradeForm, Messages) | 4h | 🟡 |

### Moyen Terme (2-4 semaines)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| MT1 | Système de niveaux (XP + déblocages progressifs) | 10h | 🔴 |
| MT2 | Missions M7-M10 (Session Master → Vétéran) | 8h | 🟡 |
| MT3 | Apprentissage progressif (révélation des features J1-J30) | 6h | 🔴 |
| MT4 | Coach IA avec LLM (OpenAI/Claude) + pattern detector | 20h | 🔴 |
| MT5 | Page "Psychologie" dédiée avec alertes et historique | 8h | 🟡 |
| MT6 | Amélioration des états vides pour toutes les pages | 4h | 🟡 |
| MT7 | Accessibilité WCAG 2.2 — Phase 1 (contraste, labels, focus) | 10h | 🟡 |

### Long Terme (1-3 mois)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| LT1 | Coach IA complet avec mémoire des conversations | 40h | 🔴 |
| LT2 | Objectifs de trading personnalisés (Goal setting) | 20h | 🔴 |
| LT3 | Analyse prédictive des performances | 30h | 🟡 |
| LT4 | Templates de signaux automatiques basés sur les performances | 20h | 🟡 |
| LT5 | Dashboard coach personnel (page dédiée) | 15h | 🟡 |
| LT6 | Session recording + heatmaps (PostHog) | 8h | 🟡 |

---

## 18. PRIORISATION IMPACT / COÛT

```
IMPACT
  ↑
  │  QW1 QW2 CT1 CT2        LT1 LT2
  │  QW6 CT3 CT4 MT1 MT4    LT3 LT5
  │  QW3 QW5 QW7 CT5 CT6    MT6 MT7
  │  CT7                     LT4 LT6
  │
  └──────────────────────────────→ COÛT
     Faible                     Élevé
```

**Priorité immédiate (Quadrant supérieur gauche) :**
1. QW1 — États vides (impact immédiat, effort minimal)
2. QW2 — Tooltips TradeForm
3. QW6 — Guide Driver.js "Bienvenue"
4. CT1 — Guide "Premier Trade"
5. CT3 — Widget Coach IA basique

---

## 19. VERDICT FINAL

🟢 **TRÈS BON — Mais nécessite des améliorations ciblées**

L'application NBA est techniquement solide (Next.js 16, React 19, design système cohérent, architecture propre). L'expérience utilisateur est bonne pour les utilisateurs qui explorent par eux-mêmes.

**Les 3 problèmes majeurs :**

1. 🔴 **Aucun guidage après l'onboarding KYC** — L'utilisateur termine l'onboarding, attend 24h, puis arrive sur une interface riche sans aucune explication. C'est le plus gros risque d'abandon.

2. 🔴 **Fonctionnalités riches mais invisibles** — Le journal de trading, les statistiques avancées, les alertes psychologiques, les réflexions sont des fonctionnalités puissantes mais que l'utilisateur ne découvre jamais naturellement.

3. 🟡 **Absence totale de système d'apprentissage** — Pas de progression, pas de missions, pas de coach, pas de gamification. L'utilisateur n'a aucune raison de revenir régulièrement ni d'explorer les fonctionnalités avancées.

**La vision :** Transformer NBA d'une "plateforme de signaux avec un journal" en un "coach de trading intelligent" qui accompagne chaque utilisateur de débutant à expert.

### Prochaine Action Immédiate

```bash
# 1. Créer le composant EmptyState (déjà dans le design system)
# 2. Ajouter Driver.js + créer le guide "Bienvenue"
# 3. Ajouter les états vides dans Journal, Messages, Réflexions
npm install driver.js
```

### Architecture des Fichiers à Créer

```
src/
├── app/
│   └── components/
│       ├── coach-ia.tsx              # Widget Coach IA
│       └── enhanced-tooltip.tsx       # Tooltip Floating UI enrichi
├── components/
│   ├── missions-panel.tsx            # Panneau des missions
│   └── confetti.tsx                  # Animation de célébration
├── hooks/
│   ├── use-coach-events.ts           # Émetteur d'événements coach
│   └── use-user-level.ts             # Niveau et progression
├── lib/
│   └── coach/
│       ├── events.ts                 # Types d'événements
│       ├── patterns.ts               # Détecteurs de patterns
│       └── providers/
│           ├── types.ts
│           └── factory.ts
├── lib/
│   └── analytics.ts                  # PostHog helper
└── components/
    └── guides/
        ├── welcome-guide.tsx         # Guide Driver.js "Bienvenue"
        ├── first-trade-guide.tsx     # Guide "Premier Trade"
        └── stats-guide.tsx           # Guide "Découvrir les Stats"
```

---

*Audit réalisé par l'équipe d'experts UX multidisciplinaire.*  
*Pour toute question : support@signauxx.com*
