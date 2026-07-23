# Carte de propagation — Fonctionnalités Admin

Ce document cartographie **tous les points** qu'une fonctionnalité admin traverse pour être correctement propagée.  
Sert de checklist pour toute nouvelle fonctionnalité ou modification.

---

## Les 11 couches de propagation

```
[DB] → [Layout serveur] → [React Context] → [Config navigation] → [Composants nav]
   ↓                                                     ↓              ↓
[API routes] ← [Middleware] ← [Page rendering] ← [Nav sidebar/mobile]
                                    ↓
                           [Feature component]
                                    ↓
                           [User panel / Context panel]
                                    ↓
                           [Commande palette]
```

---

## 1. Base de données

**Fichier :** `prisma/schema.prisma`  
**Modèles :** `Role`, `Permission`, `RolePermission`

Si la feature nécessite un nouveau rôle ou une nouvelle permission :
- Ajouter le rôle dans `roles`
- Ajouter la permission dans `permissions`
- Associer dans `role_permissions`
- Vérifier les rôles existants : `SUPER_ADMIN`, `ADMIN`, `KYC_AGENT`, `SUPPORT_AGENT`, `MEMBER`

---

## 2. Layout serveur (garde principale)

**Fichier :** `src/app/(admin)/layout.tsx`

```typescript
// Récupère le rôle depuis la DB
const userDb = await prisma.user.findUnique({...})
userRole = userDb?.role?.name

// Garde : bloquer si pas ADMIN/SUPER_ADMIN
if (!userRole || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
  redirect("/403")
}
```

**Checklist :**
- [ ] Le rôle est bien récupéré depuis la DB
- [ ] La garde bloque les rôles non autorisés
- [ ] Le rôle est passé dans `<AdminRoleProvider role={userRole}>`

---

## 3. React Context (AdminRoleContext)

**Fichier :** `src/app/(admin)/admin/role-context.tsx`

Fourni par le layout, consommé par les composants clients.  
Hook : `useAdminRole()` expose `{ isSuperAdmin, role }`.

**Consommateurs :**
- `page.tsx` → isSuperAdmin pour settings/crons
- `FormationTab.tsx` → isSuperAdmin pour catalogue features
- `user-panel-content.tsx` → isSuperAdmin pour zone de danger

**Ajouter un consommateur quand :** un composant client doit savoir si l'admin est SUPER_ADMIN.

---

## 4. Configuration de la navigation

### 4a. Définition des contextes et tabs

**Fichier :** `src/app/(admin)/admin/admin-context.ts`

```typescript
const context: AdminContextDef = {
  id: "mon-contexte",
  label: "Mon Contexte",
  icon: SomeIcon,
  requiredRole?: "SUPER_ADMIN",  // Optionnel : si défini, visible SUPER_ADMIN seulement
  tabs: [
    { value: "mon-onglet", label: "Mon Onglet" },
    { value: "mon-onglet-sa", label: "Mon SA", requiredRole: "SUPER_ADMIN" }, // Tab réservé
  ],
}
```

**Checklist :**
- [ ] Définir le contexte dans `ADMIN_CONTEXTS`
- [ ] Ajouter `requiredRole: "SUPER_ADMIN"` si réservé au super admin
- [ ] Ajouter `requiredRole` sur chaque tab individuellement si besoin

### 4b. Filtrage automatique

**Fichier :** `src/config/navigation.ts`

Le filtrage se fait automatiquement par :
- `filterNavItems(items, role)` → filtre chaque NavItem par `requiredRoles`
- `adminSidebarSections` → `.filter(c => !c.requiredRole)` + `.filter(t => !t.requiredRole)`
- `getSuperAdminSections()` → injecte les sections réservées
- `adminMobile` → propage `requiredRoles` depuis le contexte

**Checklist :**
- [ ] Vérifier que la sidebar desktop filtre l'item
- [ ] Vérifier que la nav mobile filtre l'item
- [ ] Si SUPER_ADMIN seulement : ne PAS ajouter aux `adminStandaloneLinks` sans `requiredRoles`

---

## 5. Composants de navigation

### 5a. Sidebar desktop

**Fichier :** `src/app/components/sidebar.tsx`

```typescript
const sections = getSidebarSections("admin", user.role)
const superSections = user.role === "SUPER_ADMIN" ? getSuperAdminSections() : []
```

Affiche `sections` + `superSections` avec styling ambre pour la section Système.

**Checklist :**
- [ ] L'item apparaît dans la sidebar desktop
- [ ] Si SUPER_ADMIN seulement : dans superSections avec styling ambre

### 5b. Menu mobile (drawer)

**Fichier :** `src/app/components/mobile-menu.tsx`

```typescript
const sections = getSidebarSections(space, user.role)
```

Filtre automatiquement via `getSidebarSections` → `filterNavItems`.

### 5c. Bottom navigation

**Fichier :** `src/app/components/mobile-bottom-nav.tsx`

```typescript
const links = getMobileNavItems(space, user.role)
```

Filtre automatiquement via `getMobileNavItems` → `filterNavItems`.

### 5d. Sub-navigation mobile (tabs)

**Fichier :** `src/app/(admin)/admin/page.tsx` (lignes 458-479)

```typescript
if (context.requiredRole === "SUPER_ADMIN" && !isSuperAdmin) return []
const visibleTabs = context.tabs.filter(t => !(t.requiredRole === "SUPER_ADMIN" && !isSuperAdmin))
```

**Checklist :**
- [ ] Le contexte est filtré par `requiredRole`
- [ ] Les tabs individuels sont filtrés

---

## 6. Page rendering (page.tsx)

**Fichier :** `src/app/(admin)/admin/page.tsx`

```typescript
const { isSuperAdmin } = useAdminRole()
const SYSTEM_TABS = ["settings", "crons"]

// Dans le rendu :
{activeTab === "mon-onglet-sa" && (
  isSuperAdmin
    ? <MonTabSA />
    : <LockedMessage title="..." desc="..." />
)}
```

**Checklist :**
- [ ] Ajouter un `<LockedMessage>` guard si l'onglet est SUPER_ADMIN seulement
- [ ] Ne PAS ajouter de guard si l'onglet est accessible aux deux rôles

---

## 7. Composant feature

**Fichier :** `src/app/(admin)/admin/features/MaFeature.tsx`

Si la feature a des sous-actions réservées :
```typescript
const { isSuperAdmin } = useAdminRole()
// ... conditionner les éléments sensibles à isSuperAdmin
```

---

## 8. User panel (user-panel-content.tsx)

**Fichier :** `src/app/(admin)/admin/components/user-panel-content.tsx`

Actions réservées SUPER_ADMIN : impersonate, ban, delete user, force onboarding, reset email.

```typescript
const { isSuperAdmin } = useAdminRole()
{isSuperAdmin && <BoutonDangereux />}
```

---

## 9. Commande palette

**Fichier :** `src/lib/command-palette-actions.ts`

```typescript
{ type: "action", id: "act:ma-feature", title: "...", subtitle: "...",
  href: "/admin?tab=...", requiredRole: "ADMIN" }
```

**Fichier :** `src/components/command-palette.tsx`

```typescript
.filter((a) => canUseAction(a, userRole))
```

**Checklist :**
- [ ] Ajouter `requiredRole: "ADMIN"` sur chaque action admin
- [ ] Ajouter `requiredRole: "SUPER_ADMIN"` si réservé

---

## 10. API Routes

**Fichier :** `src/app/api/admin/ma-feature/route.ts`

```typescript
// Pour les deux rôles :
await requireRole(["ADMIN", "SUPER_ADMIN"])

// Pour SUPER_ADMIN seulement si besoin :
const { role } = await requireRole(["SUPER_ADMIN"])
```

**Pattern disponibles :**
- `requireRole(["ADMIN", "SUPER_ADMIN"])` → les deux rôles
- `requireRole(["SUPER_ADMIN"])` → SUPER_ADMIN seulement
- `requirePermission("ma.permission")` → permission spécifique

---

## 11. Middleware

**Fichier :** `src/middleware.ts`

Protège `/admin` (toutes routes) au niveau authentification (pas rôle).  
Le rôle est vérifié dans le layout serveur.

---

## Résumé visuel

```
Ajouter un onglet "Rapports" visible par ADMIN + SUPER_ADMIN :

1. admin-context.ts   → ajouter { value: "reports", label: "Rapports" }
2. navigation.ts      → auto-généré via ADMIN_CONTEXTS
3. sidebar.tsx         → auto-généré via getSidebarSections
4. mobile-bottom-nav   → auto-généré via getMobileNavItems
5. page.tsx            → ajouter {activeTab === "reports" && <ReportsTab />}
6. ReportsTab.tsx      → créer le composant
7. command-palette     → ajouter requiredRole: "ADMIN"
8. API route           → ajouter requireRole(["ADMIN", "SUPER_ADMIN"])
```

```
Ajouter un onglet "Configuration SMTP" visible SUPER_ADMIN seulement :

1. admin-context.ts   → { value: "smtp", label: "SMTP", requiredRole: "SUPER_ADMIN" }
   (ou nouveau contexte avec requiredRole: "SUPER_ADMIN")
2. navigation.ts      → auto-filtré par filterNavItems + getSuperAdminSections
3. sidebar.tsx         → auto-généré via getSuperAdminSections() (section ambre)
4. mobile bottom      → auto-filtré via getMobileNavItems
5. mobile sub-nav     → filtré par le guard isSuperAdmin
6. page.tsx            → ajouter isSuperAdmin ? <SmtpTab /> : <LockedMessage />
7. command-palette     → requiredRole: "SUPER_ADMIN"
8. API route           → requireRole(["SUPER_ADMIN"])
9. user-panel          → si opérations sensibles : guard isSuperAdmin
```

---

## Fichiers clés résumés

| Rôle | Fichier |
|------|---------|
| Définition de la navigation admin | `src/app/(admin)/admin/admin-context.ts` |
| Génération des items de navigation | `src/config/navigation.ts` |
| Sidebar desktop | `src/app/components/sidebar.tsx` |
| Menu mobile (drawer) | `src/app/components/mobile-menu.tsx` |
| Navigation mobile (bottom) | `src/app/components/mobile-bottom-nav.tsx` |
| Page admin + guards | `src/app/(admin)/admin/page.tsx` |
| Contexte de rôle (React context) | `src/app/(admin)/admin/role-context.tsx` |
| Layout serveur (garde principale) | `src/app/(admin)/layout.tsx` |
| Commande palette - actions | `src/lib/command-palette-actions.ts` |
| Commande palette - composant | `src/components/command-palette.tsx` |
| Panneau utilisateur (danger zone) | `src/app/(admin)/admin/components/user-panel-content.tsx` |
| API auth utils (requireRole) | `src/lib/auth-utils.ts` |
| Structure DB (roles/permissions) | `prisma/schema/prisma` |
