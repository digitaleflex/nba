# PLAN DE CORRECTIONS — ONBOARDING

## Quick Wins (Phase 0) — En cours

| # | Action | Effort | Impact | Fichiers | Statut |
|---|--------|--------|--------|----------|--------|
| **QW1** | Etats vides (Journal, Messages, Reflexions, Notifications) | 1h | Haute | `journal/page.tsx`, `messages/page.tsx` | 🔲 |
| **QW2** | Tooltips champs critiques TradeForm | 2h | Haute | `trade-form.tsx` | 🔲 |
| **QW3** | Badge "Nouveau" + animation slideIn signaux | 1h | Moyenne | `signals-view.tsx` | 🔲 |
| **QW4** | `role="alert"` manquants | 30min | Moyenne | multiples | 🔲 |
| **QW5** | Lien "Decouvrir le Journal" dans etat vide signaux | 30min | Moyenne | `signals-view.tsx` | 🔲 |
| **QW6** | Guide Driver.js "Bienvenue sur NBA" | 3h | Haute | `dashboard/layout.tsx`, `components/guides/` | 🔲 |
| **QW7** | Aria-labels sur boutons d'icones | 1h | Moyenne | multiples | 🔲 |

## Court Terme (Phase 1)

| # | Action | Effort | Impact | Statut |
|---|--------|--------|--------|--------|
| **CT1** | Guide Driver.js "Premier Trade" | 4h | Haute | 🔲 |
| **CT2** | Guide "Decouvrir les Statistiques" (5 trades) | 3h | Haute | 🔲 |
| **CT3** | Widget Coach IA basique | 8h | Haute | 🔲 |
| **CT4** | Missions J1-J6 | 6h | Moyenne | 🔲 |
| **CT5** | Animations Framer Motion (A1-A6) | 4h | Moyenne | 🔲 |

## Fichiers a Creer

```
src/components/guides/welcome-guide.tsx
src/components/guides/first-trade-guide.tsx
src/components/guides/stats-guide.tsx
src/components/coach-ia.tsx
src/components/enhanced-tooltip.tsx
src/components/missions-panel.tsx
src/components/confetti.tsx
src/hooks/use-coach-events.ts
src/hooks/use-user-level.ts
src/lib/coach/events.ts
src/lib/coach/patterns.ts
src/lib/coach/providers/types.ts
src/lib/analytics.ts
```
