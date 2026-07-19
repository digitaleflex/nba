# MASTER AUDIT — Navigation Mobile & Layout System

## Résumé exécutif

- **Projet** : NeverBrokeAgain (Next.js 16.2.9, App Router)
- **Symptôme** : la Bottom Navigation change selon les pages (7, 6, 5 ou 0 onglets).
- **Cause racine** : un seul composant `MobileBottomNav` est monté dans **deux layouts distincts** (`(dashboard)/layout.tsx` et `(admin)/layout.tsx`) avec la prop `isAdmin`. Le contenu bascule entre `userLinks` et `adminLinks`. Il n'existe **pas de source de vérité** pour la navigation mobile.
- **Impact** : duplication de logique, composants orphelins, instabilité visuelle, maintenance difficile.
- **Note UX** : 4/10.
- **Fichiers critiques** : `src/app/components/mobile-bottom-nav.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/app/components/sidebar.tsx`, `src/app/components/mobile-menu.tsx`, `src/app/(admin)/admin/admin-context.tsx`.

---

## AUDIT 1 — Architecture

### Layouts identifiés

| Fichier | Type | Rôle |
|---|---|---|
| `src/app/layout.tsx` | Root | Police, viewport, thème, top-loader, bannière impersonation, toast |
| `src/app/(auth)/layout.tsx` | Route Group | Pages d'auth (login, register, etc.) — centré, sans nav |
| `src/app/(onboarding)/layout.tsx` | Route Group | Onboarding — sans nav |
| `src/app/(dashboard)/layout.tsx` | Route Group | Espace membre (dashboard, signaux, journal, etc.) |
| `src/app/(admin)/layout.tsx` | Route Group | Espace admin ( `/admin/*`) |

### Imbrication visuelle

```
RootLayout
├── ThemeProvider
│   ├── TopLoader
│   ├── ImpersonationBanner
│   ├── TooltipProvider
│   ├── ToastProvider
│   └── children
│       ├── (auth)/layout.tsx
│       ├── (onboarding)/layout.tsx
│       ├── (dashboard)/layout.tsx
│       │   ├── MessagingUnreadProvider
│       │   │   ├── CommandPaletteProvider
│       │   │   ├── Sidebar isAdmin={false}
│       │   │   ├── Header desktop (inline)
│       │   │   ├── Header mobile (inline)
│       │   │   ├── main + ErrorBoundary
│       │   │   └── MobileBottomNav isAdmin={false}
│       │   └── ...
│       └── (admin)/layout.tsx
│           ├── MessagingUnreadProvider
│           │   ├── CommandPaletteProvider
│           │   ├── Sidebar isAdmin={true}
│           │   ├── AdminHeader (desktop)
│           │   ├── Header mobile (inline)
│           │   ├── main + ErrorBoundary
│           │   └── MobileBottomNav isAdmin={true}
│           └── ...
```

### Observations

- **Aucun layout intermédiaire partagé** entre dashboard et admin. Chaque Route Group réimplémente la même structure (sidebar, header, bottom nav, providers).
- **Aucun `MobileLayout`, `ResponsiveLayout` ou `AppLayout`** dédié n'existe.
- Les Route Groups `(dashboard)` et `(admin)` sont utilisés comme des namespaces, pas comme des conteneurs de layout partagés.
- Les providers `MessagingUnreadProvider` et `CommandPaletteProvider` sont montés deux fois avec des enfants différents (ce qui est normal, mais souligne l'absence de layout parent commun).

### Providers

| Provider | Scope | Fichier |
|---|---|---|
| `ThemeProvider` | Global | `packages/design-system/providers/theme-provider.tsx` |
| `TooltipProvider` | Global | `packages/design-system/providers/tooltip-provider.tsx` |
| `ToastProvider` | Global | `packages/design-system/providers/toast-provider.tsx` |
| `TopLoader` | Global | `packages/design-system` |
| `MessagingUnreadProvider` | Dashboard + Admin | `src/lib/messaging-unread.tsx` |
| `CommandPaletteProvider` | Dashboard + Admin | `src/components/command-palette.tsx` |

### Middleware

- `src/proxy.ts` (exporté comme middleware) gère les redirections auth.
- Pas de `middleware.ts` à la racine.
- Il ne décide pas de la navigation, seulement de l'accès.

---

## AUDIT 2 — Navigation

### Composants de navigation

| Fichier | Rôle | Statut |
|---|---|---|
| `src/app/components/mobile-bottom-nav.tsx` | **Bottom Navigation mobile** | Utilisé |
| `src/app/components/sidebar.tsx` | Sidebar desktop (user + admin) | Utilisé |
| `src/app/components/mobile-menu.tsx` | Drawer menu mobile | Utilisé |
| `src/app/(admin)/admin/components/admin-header.tsx` | Header desktop admin | Utilisé |
| `src/app/(admin)/components/admin-sidebar.tsx` | Sidebar admin détaillée | **ORPHELIN** |
| `src/app/(dashboard)/components/dashboard-header.tsx` | Header dashboard complet | **ORPHELIN** |

### Bottom Navigation unique mais doublement montée

```tsx
// (dashboard)/layout.tsx
<MobileBottomNav isAdmin={false} user={user} />

// (admin)/layout.tsx
<MobileBottomNav isAdmin={true} user={user} />
```

### Tableau comparatif des Bottom Navigation

| Critère | Dashboard (`isAdmin=false`) | Admin (`isAdmin=true`) |
|---|---|---|
| Fichier source | `mobile-bottom-nav.tsx` | `mobile-bottom-nav.tsx` |
| Nombre de **liens de navigation** | 4 (user standard) ou 5 (user admin) | 4 |
| Nombre total d'items (liens + boutons fixes) | 6 ou 7 | 6 |
| Labels | Signaux, Journal, Onboarding, [Admin], Messages | Surveiller, Décider, Communiquer, Auditer |
| Icônes | `TrendingUp`, `BookOpen`, `Shield`, `[ShieldCheck]`, `MessageCircle` | `Activity`, `Gavel`, `Radio`, `ShieldCheck` |
| Boutons fixes | Recherche, Quitter | Recherche, Quitter |
| Active logic | `pathname.startsWith(...)` | `pathname.startsWith("/admin") && currentContext === context.id` |
| Dépendance rôle | Affiche "Admin" si `ADMIN`/`SUPER_ADMIN` | Aucune (déjà dans layout admin) |
| Badge | Messages non lus | Demandes d'accès en attente |

### Détail des items utilisateur (`userLinks`)

```tsx
const userLinks = [
  { href: "/dashboard/signals", label: "Signaux" },
  { href: "/dashboard/journal", label: "Journal" },
  { href: "/dashboard/verification", label: "Onboarding" },
  ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN"
    ? [{ href: "/admin", label: "Admin" }]
    : []),
  { href: "/dashboard/messages", label: "Messages" },
]
```

### Détail des items admin (`adminLinks`)

```tsx
const adminLinks = ADMIN_CONTEXTS.map((context) => {
  const repr = context.tabs[0]
  return {
    href: `/admin?tab=${repr.value}`,
    label: context.label,
    icon: context.icon,
    active: isAdminArea && currentContext === context.id,
  }
})
```

Les 4 contextes admin sont définis dans `src/app/(admin)/admin/admin-context.tsx` :

| Contexte | Label | Onglets |
|---|---|---|
| `surveiller` | Surveiller | dashboard, stats, analytics, devices, crons |
| `decider` | Décider | requests, membres, users, kyc, broker |
| `communiquer` | Communiquer | signals, emails, notifications |
| `auditer` | Auditer | audit, moderation, security, settings, formation |

### Pourquoi 7 onglets ?

L'utilisateur admin sur `/dashboard/*` voit :
- 5 liens de navigation (Signaux, Journal, Onboarding, **Admin**, Messages)
- 2 boutons fixes (Recherche, Quitter)
- **Total : 7 items**

Sur `/admin/*` il voit :
- 4 liens (Surveiller, Décider, Communiquer, Auditer)
- 2 boutons fixes
- **Total : 6 items**

Un utilisateur standard sur `/dashboard/*` voit **6 items** (4 liens + 2 boutons).

### Sidebar desktop

- Même composant `Sidebar` monté avec `isAdmin={false}` ou `isAdmin={true}`.
- Contenu différent mais structure partagée.
- Gestion du collapse via `localStorage`.
- Badge messages non lus.
- Lien "Accéder à l'Admin" / "Retour au Dashboard" selon rôle.

---

## AUDIT 3 — Routage

| Route / Groupe | Layout(s) | BottomNav | Sidebar | Header | Providers |
|---|---|---|---|---|---|
| `/` | `RootLayout` | Aucune | Aucune | Aucun | Theme, Tooltip, Toast |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/cgu`, `/privacy`, `/cookies`, `/risk-disclaimer` | `RootLayout` → `AuthLayout` | Aucune | Aucune | Aucun | Theme, Tooltip, Toast |
| `/onboarding`, `/onboarding/*` | `RootLayout` → `OnboardingLayout` | Aucune | Aucune | Aucun | Theme, Tooltip, Toast |
| `/dashboard`, `/dashboard/*` | `RootLayout` → `DashboardLayout` | `MobileBottomNav` (`isAdmin=false`) | `Sidebar` (`isAdmin=false`) | Header inline (desktop + mobile) | + MessagingUnread, CommandPalette |
| `/signals`, `/signals/[id]` | `RootLayout` → `DashboardLayout` | `MobileBottomNav` (`isAdmin=false`) | `Sidebar` (`isAdmin=false`) | Header inline | + MessagingUnread, CommandPalette |
| `/data` | `RootLayout` → `DashboardLayout` | `MobileBottomNav` (`isAdmin=false`) | `Sidebar` (`isAdmin=false`) | Header inline | + MessagingUnread, CommandPalette |
| `/admin`, `/admin/*` | `RootLayout` → `AdminLayout` | `MobileBottomNav` (`isAdmin=true`) | `Sidebar` (`isAdmin=true`) | `AdminHeader` (desktop) + header inline (mobile) | + MessagingUnread, CommandPalette |
| `/401`, `/403`, `/blocked` | `RootLayout` | Aucune | Aucune | Aucun | Theme, Tooltip, Toast |
| `/api/*` | Aucun layout React | Aucune | Aucune | Aucun | Aucun |

### Routes dashboard détaillées

| Route | Layout | BottomNav | Sidebar | Header |
|---|---|---|---|---|
| `/dashboard` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/signals` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/signals/[id]` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/journal` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/verification` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/subscription` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/notifications` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/messages` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/profile` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/support` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/devices` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/dashboard/verify-device` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/signals` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/signals/[id]` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |
| `/data` | DashboardLayout | `isAdmin=false` | `isAdmin=false` | Inline |

### Routes admin détaillées

| Route | Layout | BottomNav | Sidebar | Header |
|---|---|---|---|---|
| `/admin` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin?tab=*` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/control-room` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/tracker` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/cache` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/queues` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/members` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/audit` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/webhooks/dlq` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/messages` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |
| `/admin/support` | AdminLayout | `isAdmin=true` | `isAdmin=true` | `AdminHeader` + mobile |

---

## AUDIT 4 — Conditions

### Authentification

| Emplacement | Condition |
|---|---|
| `src/proxy.ts` L26 | `const isAuthenticated = hasSession(request)` |
| `src/proxy.ts` L28 | `/` redirige vers `/dashboard` ou `/login` |
| `src/proxy.ts` L32-35 | Auth routes redirigent un user authentifié vers `/dashboard` |
| `src/proxy.ts` L41-47 | Protected prefixes (`/dashboard`, `/admin`, `/onboarding`) redirigent vers `/login` si pas de session |
| `src/app/(dashboard)/layout.tsx` L16 | `if (!session) redirect("/login")` |
| `src/app/(admin)/layout.tsx` L16 | `if (!session) redirect("/login")` |
| `src/app/(onboarding)/layout.tsx` | `if (!session) redirect("/login")` |

### Rôle / permissions

| Emplacement | Condition |
|---|---|
| `src/app/(admin)/layout.tsx` L23-25 | `if (!userDb || role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/403")` |
| `src/app/components/mobile-bottom-nav.tsx` L85-92 | Affiche le lien "Admin" si `user.role === "ADMIN" \|\| "SUPER_ADMIN"` |
| `src/app/components/sidebar.tsx` L200 | `showAdminSwitch = !isAdmin && (user.role === "ADMIN" \|\| "SUPER_ADMIN")` |
| `src/app/components/mobile-menu.tsx` L111 | `showAdminSwitch = !isAdmin && (user.role === "ADMIN" \|\| "SUPER_ADMIN")` |

### Responsive / mobile

| Emplacement | Condition |
|---|---|
| `src/app/components/mobile-bottom-nav.tsx` L121 | `md:hidden` (mobile uniquement) |
| `src/app/components/mobile-menu.tsx` L119 | `md:hidden` sur le bouton menu |
| `src/app/components/sidebar.tsx` L210 | `hidden md:flex` (desktop uniquement) |
| `src/app/(dashboard)/layout.tsx` L39 | `hidden md:flex` header desktop |
| `src/app/(dashboard)/layout.tsx` L60 | `md:hidden` header mobile |
| `src/app/(admin)/layout.tsx` L41 | `hidden md:flex` header desktop via `AdminHeader` |
| `src/app/(admin)/layout.tsx` L45 | `md:hidden` header mobile |
| `src/components/command-palette.tsx` | `useMediaQuery("(max-width: 767px)")` |

### Pathname / active state

| Emplacement | Condition |
|---|---|
| `src/app/components/mobile-bottom-nav.tsx` L33 | `const pathname = usePathname()` |
| `src/app/components/mobile-bottom-nav.tsx` L36 | `const activeTab = searchParams.get("tab") \|\| ""` |
| `src/app/components/mobile-bottom-nav.tsx` L71-99 | Active state par `pathname.startsWith(...)` |
| `src/app/components/mobile-bottom-nav.tsx` L103 | `const isAdminArea = pathname.startsWith("/admin")` |
| `src/app/components/sidebar.tsx` L48 | `const pathname = usePathname()` |
| `src/app/components/sidebar.tsx` L51 | `const activeTab = searchParams.get("tab") \|\| "dashboard"` |
| `src/app/components/mobile-menu.tsx` L48 | `const pathname = usePathname()` |
| `src/app/components/mobile-menu.tsx` L51 | `const activeTab = searchParams.get("tab") \|\| "dashboard"` |

### Feature flags

- **Aucun feature flag** explicite (`process.env.ENABLE_*`) n'a été trouvé dans les fichiers de navigation.
- Le changement de navigation est 100% déterminé par la route (layout) et le rôle utilisateur.

---

## AUDIT 5 — Conflits

### Composants orphelins (jamais utilisés dans un layout actuel)

| Composant | Chemin | Problème |
|---|---|---|
| `AdminSidebar` | `src/app/(admin)/components/admin-sidebar.tsx` | Sidebar admin complète et indépendante. **Non importée** dans `(admin)/layout.tsx`. Le layout admin utilise `Sidebar` générique. |
| `DashboardHeader` | `src/app/(dashboard)/components/dashboard-header.tsx` | Header desktop/mobile avec sa propre navigation. **Non importé** dans `(dashboard)/layout.tsx`. Le layout dashboard construit son header inline. |

### Logique de navigation dupliquée

| Logique | Localisations | Observation |
|---|---|---|
| Liens utilisateur | `sidebar.tsx` L79-116, `mobile-menu.tsx` L60-66, `mobile-bottom-nav.tsx` L66-99, `dashboard-header.tsx` L22-28 | **4 tableaux `userLinks` distincts**, pas de source unique. |
| Liens admin par contexte | `sidebar.tsx` L148-197, `mobile-menu.tsx` L68-108, `mobile-bottom-nav.tsx` L104-112, `admin-sidebar.tsx` | **4 implémentations** différentes de la même structure `ADMIN_CONTEXTS`. |
| Mapping icônes admin | `sidebar.tsx` L168-184, `mobile-menu.tsx` L82-98 | Dupliqué. |
| `standaloneByContext` | `sidebar.tsx` L148-163, `mobile-menu.tsx` L70-81 | Dupliqué. |
| Gestion logout | `mobile-bottom-nav.tsx`, `mobile-menu.tsx`, `sidebar.tsx`, `dashboard-header.tsx`, `logout-button.tsx` | **5 implémentations** de `authClient.signOut()` + redirection. |
| Badge messages non lus | `mobile-bottom-nav.tsx` L117, `sidebar.tsx` L201-205 | Logique similaire dupliquée. |
| Pending access requests | `mobile-bottom-nav.tsx` L38-51 | Fetch KYC/requests uniquement ici, pas de réutilisation. |

### Conflits structurels

| Conflit | Description |
|---|---|
| **Sidebar vs AdminSidebar** | Le layout admin monte `Sidebar` (composant générique) qui reconstruit la navigation admin via `ADMIN_CONTEXTS`. L'`AdminSidebar` (plus détaillée, avec groupes Supervision/Membres/Communication/Système/Social) est ignorée. |
| **Header dashboard inline vs DashboardHeader** | Le layout dashboard construit manuellement un header desktop et mobile. `DashboardHeader` définit une navigation complète différente (`/dashboard`, `/dashboard/signals`, `/dashboard/profile`, `/dashboard/subscription`, `/dashboard/notifications`) qui n'est pas utilisée. |
| **MobileBottomNav admin vs AdminSidebar** | La bottom nav admin affiche 4 contextes. L'AdminSidebar affiche 5 sections avec plus de liens. Les deux ne sont pas synchronisés. |
| **CommandPalette vs AdminHeader** | `AdminHeader` a sa propre modale de recherche (`Ctrl+K`). `CommandPalette` en a une autre. Les deux écoutent le même raccourci. |

---

## AUDIT 6 — UX

### Évaluation

| Critère | Note | Commentaire |
|---|---|---|
| Cohérence | 3/10 | Navigation mobile différente sur chaque espace. Labels et icônes ne correspondent pas à la sidebar desktop. |
| Stabilité | 3/10 | Changement visuel brutal au passage `/dashboard` → `/admin`. Les items changent de nombre, de labels et d'icônes. |
| Prévisibilité | 4/10 | L'utilisateur ne sait pas à l'avance quelle barre va s'afficher. Le lien "Admin" apparaît/disparaît selon le rôle. |
| Ergonomie | 5/10 | 6 à 7 items en bottom nav, c'est beaucoup. Boutons "Recherche" et "Quitter" en permanence réduisent l'espace. |
| Accessibilité | 4/10 | Pas de `aria-current` visible. Les labels "Surveiller", "Décider", "Communiquer", "Auditer" sont abstraits. |
| Navigation | 4/10 | Pas de hiérarchie claire entre espaces. L'admin mobile regroupe 14 onglets en 4 contextes mentaux. |
| Charge cognitive | 3/10 | Trop d'items, vocabulaire différent entre mobile et desktop, double navigation (drawer + bottom bar). |

### Note globale UX

**4/10**

Le système est fonctionnel mais instable. L'utilisateur subit un changement de paradigme de navigation à chaque changement d'espace. La duplication interne du code rend toute évolution risquée (oublis de synchronisation entre mobile et desktop).

---

## AUDIT 7 — Performance

### Re-renders et remontages

| Problème | Localisation | Impact |
|---|---|---|
| `MobileBottomNav` client component | `mobile-bottom-nav.tsx` | Re-render à chaque changement de pathname, searchParams, messaging unread, pending requests. |
| `MobileMenu` client component | `mobile-menu.tsx` | Re-render à chaque changement de pathname, searchParams. |
| `Sidebar` client component | `sidebar.tsx` | Re-render à chaque changement de pathname, searchParams, messaging unread, pending KYC. |
| `useEffect` fetch pending requests | `mobile-bottom-nav.tsx` L38-51 | Un fetch est fait côté client à chaque montage de la bottom nav admin. |
| `useEffect` fetch pending KYC | `sidebar.tsx` L134-145 | Un fetch est fait côté client à chaque montage de la sidebar admin. |
| Layouts server components | `(dashboard)/layout.tsx`, `(admin)/layout.tsx` | Re-render du layout à chaque navigation, mais le DOM persiste partiellement grâce à Next.js. |

### Pertes d'état

- Le `lastActiveTab` de `MobileBottomNav` est stocké en `useState` local. Il est **perdu à chaque navigation** entre dashboard et admin (car le composant est démonté/remonté dans un autre layout).
- Le collapse de la sidebar est stocké en `localStorage`, donc persistant.
- Les providers `MessagingUnreadProvider` et `CommandPaletteProvider` sont montés dans chaque layout, donc leur état interne est **réinitialisé** au changement d'espace (dashboard → admin).

### Transitions

- Aucune transition de layout gérée par l'application. Le changement de bottom nav est instantané et brutal.

### Verdict performance

- Pas de problème de performance critique, mais une **inefficacité structurelle** : les mêmes données (badges, liens) sont recalculées et re-fetchées dans plusieurs composants au lieu d'être partagées.

---

## AUDIT 8 — Cause Racine

### Fichier et logique exacte

**Cause racine identifiée** : `src/app/components/mobile-bottom-nav.tsx`, ligne 114 :

```tsx
const links = isAdmin ? adminLinks : userLinks
```

### Mécanisme

1. Deux layouts montent le même composant avec deux props différentes :
   - `src/app/(dashboard)/layout.tsx` L89 : `<MobileBottomNav isAdmin={false} user={user} />`
   - `src/app/(admin)/layout.tsx` L62 : `<MobileBottomNav isAdmin={true} user={user} />`

2. Le composant `MobileBottomNav` est un **client component** qui reçoit `isAdmin` en prop.

3. En fonction de `isAdmin`, il choisit entre deux tableaux de liens complètement différents :
   - `userLinks` pour le dashboard
   - `adminLinks` pour l'admin

4. De plus, dans `userLinks`, un 5ème lien "Admin" est ajouté conditionnellement selon le rôle de l'utilisateur (`user.role === "ADMIN" || "SUPER_ADMIN"`).

### Pourquoi la navigation change

- **Changement de layout** : `/dashboard/*` → `/admin/*` passe de `DashboardLayout` à `AdminLayout`. Chaque layout monte `MobileBottomNav` avec `isAdmin` différent.
- **Condition de rôle** : sur `/dashboard/*`, un utilisateur admin voit un lien "Admin" supplémentaire.
- **Absence de source de vérité** : les liens sont hardcodés dans chaque composant (`MobileBottomNav`, `MobileMenu`, `Sidebar`). Aucun fichier de configuration central ne définit la navigation.

### Architecture en cause

1. **Pas de layout de navigation unifié** : il n'existe pas de `AppLayout` ou `MobileLayout` partagé par dashboard et admin.
2. **Route Groups utilisés comme namespaces** : `(dashboard)` et `(admin)` ont chacun leur propre layout, au lieu de partager un layout parent.
3. **Navigation dispersée dans les composants** : la logique de navigation est dans les composants, pas dans une configuration.
4. **Composants orphelins** : `AdminSidebar` et `DashboardHeader` sont des vestiges non utilisés, ce qui crée une confusion sur la source de vérité.

---

## PROPOSITION D'ARCHITECTURE

### Option A — Bottom Navigation unique

**Principe** : un seul `MobileBottomNav` avec une liste de liens définie dans un fichier de config. Les liens sont filtrés selon le rôle et l'espace actuel.

**Avantages**
- Un seul composant à maintenir.
- Cohérence visuelle.

**Inconvénients**
- Doit gérer la différence dashboard/admin dans le même composant.
- Peut devenir complexe si les besoins divergent beaucoup.

**Complexité** : Moyenne.
**Maintenabilité** : Bonne.
**Évolutivité** : Moyenne.

### Option B — Navigation pilotée par configuration

**Principe** : créer un fichier `src/config/navigation.ts` qui définit tous les liens (desktop, mobile, admin, user). Chaque composant (`Sidebar`, `MobileBottomNav`, `MobileMenu`) consomme cette config.

**Avantages**
- Source de vérité unique.
- Facile à tester et à modifier.
- Synchronisation automatique entre mobile et desktop.

**Inconvénients**
- Nécessite une abstraction pour gérer les icônes, les rôles, les conditions.

**Complexité** : Moyenne.
**Maintenabilité** : Très bonne.
**Évolutivité** : Très bonne.

### Option C — Navigation générée automatiquement selon les permissions

**Principe** : les liens sont générés à partir d'un système de permissions (RBAC). Chaque route définit ses permissions requises, et la navigation filtre les items accessibles.

**Avantages**
- Très sécurisé et évolutif.
- Adapté si l'application a beaucoup de rôles/permissions.

**Inconvénients**
- Nécessite un système de permissions robuste déjà en place.
- Sur-ingénierie pour le besoin actuel.

**Complexité** : Élevée.
**Maintenabilité** : Très bonne à long terme.
**Évolutivité** : Excellente.

### Option D — Architecture optimale (recommandée)

**Principe** : combiner les options A et B avec une structuration en deux niveaux :

1. **Créer un `AppLayout` partagé** dans un nouveau Route Group `(app)` qui contient :
   - `Sidebar`
   - `MobileBottomNav`
   - `MobileMenu`
   - `MessagingUnreadProvider`
   - `CommandPaletteProvider`
   - `ErrorBoundary`

2. **Créer une configuration centralisée** `src/config/navigation.ts` définissant :
   - Les espaces (dashboard, admin)
   - Les liens de chaque espace
   - Les icônes
   - Les rôles requis
   - Les conditions d'affichage

3. **Créer un `MobileBottomNav` unique** qui lit la config et affiche les liens actifs pour l'espace courant.

4. **Supprimer ou intégrer** les composants orphelins (`AdminSidebar`, `DashboardHeader`).

5. **Uniformiser les labels** entre desktop et mobile.

**Avantages**
- Une seule source de vérité.
- Navigation stable.
- Réduction de la duplication.
- Facilité de maintenance et d'évolution.

**Inconvénients**
- Refactoring nécessaire des Route Groups.
- Tests de non-régression sur toutes les routes.

**Complexité** : Moyenne-Élevée.
**Maintenabilité** : Excellente.
**Évolutivité** : Excellente.

---

## RECOMMANDATION

**Choisir l'Option D**.

L'application a déjà une structure claire (dashboard / admin) et un rôle unique (admin vs user). Une config centralisée est suffisante sans avoir besoin d'un RBAC complet. Le `AppLayout` partagé résout l'instabilité visuelle en garantissant une seule montée de la navigation.

---

## PLAN DE REFACTORING

### Phase 1 — Préparation et nettoyage

**Objectif** : stabiliser avant de refactorer.

1. **Supprimer les composants orphelins** ou les intégrer :
   - `src/app/(admin)/components/admin-sidebar.tsx`
   - `src/app/(dashboard)/components/dashboard-header.tsx`
2. **Identifier toutes les pages** qui dépendent de `DashboardLayout` et `AdminLayout`.
3. **Créer un snapshot** des routes actuelles pour valider la non-régression.
4. **Écrire les tests** des layouts existants (si absents).

**Risques** : Faibles si on supprime uniquement des fichiers non utilisés.
**Estimation** : 0.5 jour.

### Phase 2 — Config centralisée

**Objectif** : créer la source de vérité.

1. Créer `src/config/navigation.ts` avec :
   ```ts
   export const NAVIGATION = {
     dashboard: {
       mobile: [...],
       sidebar: [...],
       menu: [...],
     },
     admin: {
       mobile: [...],
       sidebar: [...],
       menu: [...],
     },
   }
   ```
2. Définir les types : `NavItem`, `NavSection`, `NavSpace`.
3. Ajouter les helpers : `getNavItems(space, role)`, `isNavItemVisible(item, role)`.
4. Migrer les icônes et les mappings dans la config.

**Risques** : Moyens — s'assurer que tous les liens actuels sont conservés.
**Estimation** : 1 jour.

### Phase 3 — AppLayout partagé

**Objectif** : unifier les layouts.

1. Créer un nouveau Route Group `(app)` avec `src/app/(app)/layout.tsx`.
2. Déplacer le contenu commun de `DashboardLayout` et `AdminLayout` dans `(app)/layout.tsx` :
   - `Sidebar`
   - `MobileBottomNav`
   - `MobileMenu`
   - Providers (`MessagingUnreadProvider`, `CommandPaletteProvider`)
   - `ErrorBoundary`
3. Simplifier `src/app/(dashboard)/layout.tsx` et `src/app/(admin)/layout.tsx` pour qu'ils ne gèrent que leurs spécificités (ex: `AdminHeader`).
4. Alternative si le déplacement de routes est trop risqué : créer un composant `AppShell` importé dans les deux layouts existants.

**Risques** : Élevés — changement de structure de routage. **Tester chaque route**.
**Estimation** : 1.5 jour.

### Phase 4 — Refonte des composants de navigation

**Objectif** : consommer la config.

1. Réécrire `MobileBottomNav` pour lire `NAVIGATION`.
2. Réécrire `Sidebar` pour lire `NAVIGATION`.
3. Réécrire `MobileMenu` pour lire `NAVIGATION`.
4. Supprimer les tableaux hardcodés (`userLinks`, `adminLinks`, etc.).
5. Unifier la gestion du logout dans un seul composant/hook.
6. Unifier les badges (messages non lus, KYC pending) dans un seul hook.

**Risques** : Moyens — impact direct sur l'UX.
**Estimation** : 2 jours.

### Phase 5 — Tests et validation

1. **Tests unitaires** : `MobileBottomNav`, `Sidebar`, `MobileMenu`, helpers de config.
2. **Tests d'intégration** : navigation entre `/dashboard/*` et `/admin/*`.
3. **Tests visuels** : responsive (mobile, tablet, desktop).
4. **Tests d'accessibilité** : `aria-current`, labels, contrastes.
5. **Vérification des routes** : toutes les routes listées en Audit 3 doivent afficher la bonne navigation.

**Estimation** : 1 jour.

### Estimation totale

**5 jours** pour une refonte complète et testée.

### Ordre de priorité

1. Phase 1 (nettoyage)
2. Phase 2 (config)
3. Phase 4 (composants) — peut être faite avant Phase 3 si le `AppLayout` est trop risqué
4. Phase 3 (AppLayout)
5. Phase 5 (tests)

### Alternative conservatrice

Si le `AppLayout` est trop risqué, on peut se limiter aux Phases 1, 2 et 4 en gardant les deux layouts existants mais en les faisant consommer la même config. Cela résout la duplication et la cohérence sans changer la structure de routage.

**Estimation alternative** : 3 jours.

---

## Fichiers concernés

### À créer
- `src/config/navigation.ts`
- `src/app/(app)/layout.tsx` (option D)
- `src/hooks/use-navigation.ts` (ou utiliser l'existant)
- `src/hooks/use-logout.ts`

### À modifier
- `src/app/(dashboard)/layout.tsx`
- `src/app/(admin)/layout.tsx`
- `src/app/components/mobile-bottom-nav.tsx`
- `src/app/components/sidebar.tsx`
- `src/app/components/mobile-menu.tsx`
- `src/app/components/logout-button.tsx`

### À supprimer ou intégrer
- `src/app/(admin)/components/admin-sidebar.tsx`
- `src/app/(dashboard)/components/dashboard-header.tsx`

---

## Conclusion

Le problème de la Bottom Navigation qui change n'est pas dû à une multiplication de composants, mais à **l'absence de source de vérité** et à l'**utilisation de deux layouts distincts** qui montent le même composant avec des props différentes. La solution passe par une **configuration centralisée de navigation** et un **layout partagé** (ou un composant shell commun).

Aucun code n'a été modifié durant cet audit.
