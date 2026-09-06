# 🏷️ 06 — Pivot Deals / Leaks (Dealabs)

> **Marché :** Chasseurs promos FR (Dealabs 1M+ membres) — 1 deal = 10k partages, viralité extrême, monétisation affiliation Amazon 3-7%.

---

## 🎯 Marché cible

- **France/Belgique** : étudiants, familles, tech lovers — 10M+ chasseurs deals.
- **TAM** : Dealabs 1M+ membres, Pepper.com 50M€ CA ; Telegram leaks FR 200k+ membres.
- **Douleur** : deals expirés, pas d'alerte instantanée erreur prix, pas de suivi économies.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation deals |
|------------|---------------------|
| `Signal` + versioning | **Deal** (« 29€ → 19€ → expiré ») |
| BullMQ + Socket.IO + Push | Alerte **erreur prix** stock limité (<60s) |
| `SignalAudience` (catégorie) | Tech / maison / mode |
| `Trade` → `Achat` (économies) | Gamification « tu as économisé 342€ » |
| `Conversation` | Entraide « encore dispo ? » |
| `KycDocument` (light) | Vérif apporteurs |
| Admin 17 onglets | Modération deals |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // Deal
  prixOriginal Int?
  prixDeal     Int?
  lienAffilie  String?
  expiration   DateTime?
  categorie    String?
  stock        Int?
}
```

- Scraper **Amazon PA-API + Dealabs** + Push.
- Effort : 2 jours.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Dealabs** (1M+ users) | Affiliation ~**2M€/an** | 2M€ |
| **Pepper.com** (maison mère) | **50M€ CA** | 50M€ |
| **Chollometro** (ES, 5M users) | ~10M€/an | 10M€ |
| **@FuitesAmazon** (200k Telegram) | 5-10k€/mois affiliation | 60-120k€/an |

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Free | 0€ | 5 deals/jour + pub |
| VIP Leaks | **9-19€** | Alertes instantanées + erreurs prix + préco |
| Apporteur | Commission 5% sur ses deals | Marketplace |
| Sponsor | 200€/mois bannière | B2B |

> 500 VIP ×9€ = **4 500€/mois** + affiliation Amazon (2k clics ×3% ×5€) = **300€** → **4 800€/mois**.


## 📊 Exemple chiffré (Afrique vs Europe)

- **Afrique** : 100 payants ×19€ = **1 900€/mois** ; churn 7% → LTV 271€.
- **Europe** : 80 payants ×29€ = **2 320€/mois** ; churn 5% → LTV 580€.
- **Coût acquisition** : 5€/jour Meta → 150€/mois → 15 trials → 5 payants → CAC 30€ → payback <2 mois.

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Concurrence locale | Différenciation journal + audit + francophone |
| Churn | Streaks + push + communauté |
| Juridique | Disclaimer + CGU (doc 07) |

## 🔗 Dépendances & stack

- Next.js 16, Prisma 7, Neon, Better Auth, BullMQ, Socket.IO, Tailwind 4, Sentry.
- 0 refactor DB, 1-2 colonnes max.

---

## 🚀 Lancement 3 jours

- J1 : Fork + champs deal + PA-API.
- J2 : Landing + Stripe + 10 deals exemples.
- J3 : Poster Dealabs + Telegram leaks + X.

---

*Viralité = acquisition gratuite. 1 deal viral = 10k users.*
