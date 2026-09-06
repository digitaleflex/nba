# 🪂 02 — Pivot Crypto Airdrops / Meme Coins

> **Marché :** Chasseurs airdrops & degens meme coins (Solana, Base, Monad) — 18-30 ans, TikTok/X, FOMO extrême, WTP 15-39€/mois pour être early.

---

## 🎯 Marché cible

- **Core** : chasseurs airdrops (LayerZero, Starknet, Base) — 10M+ wallets actifs, chaque airdrop 500-5 000$ potentiel.
- **Degen meme coins** : Solana (pump.fun), Base — +200% en 10 min, besoin alerte instantanée.
- **Géo** : global anglophone + francophone (X/TikTok), 70% mobile.
- **Douleur** : info dispersée (X, Discord, Telegram), deadlines ratées, scams, pas de tracker PnL.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation crypto |
|------------|----------------------|
| `Signal` + `SignalVersion` | **Alerte Airdrop** versionnée (« snapshot annoncé → claim 12/09 → expiré ») |
| BullMQ + Socket.IO + Push VAPID | Alerte meme coin +200% **<30s** |
| `Journal` (`Trade`→Claim, `Streak`) | Tracker claims / PnL airdrops |
| `Conversation`/`Message` | Entraide « as-tu reçu LayerZero ? » |
| `SignalAudience` (plan Free/VIP) | Airdrops publics vs VIP alpha |
| `KycDocument` (light) | Vérif anti-bot pour whitelist |
| Admin 17 onglets | Modération scams |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // ... existant
  blockchain String?  // "solana" | "base"
  deadline   DateTime?
  claimUrl   String?
  tags       String[]  // ["airdrop","meme","testnet"]
}
model Trade {
  // Trade → Claim
  token      String?
  amount     Float?
  claimStatus String? // "eligible" | "claimed" | "missed"
}
```

- Brancher **API DexScreener** (prix meme coins) au lieu de Deriv.
- Effort : 1-2 jours.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **EarniFi** | Tracker airdrop, 500k users, premium 15$/mois | ~2M$/an |
| **Airdrops.io** | Ads + premium 19$/mois | ~1,2M$/an |
| **Maverick Airdrops** (Telegram VIP 29€, 3k membres) | **87k€/mois** | ~1M€/an |
| **@airdropfinder** (400k followers X) | Affiliation + VIP | 300k€/an |

> Aucun avec **journal + push + versioning** francophone.

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Free | 0€ | 3 alertes/semaine |
| Hunter | **19€** | Toutes alertes + push + deadlines |
| Degen | **39€** | + calls meme coins + tracker PnL + groupe privé |
| API | 49€ | Webhook DexScreener |

> 150 Hunter × 19€ = **2 850€/mois** ; 50 Degen ×39€ = **1 950€** → **4 800€/mois** potentiel.


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

- J1 : Fork + tags blockchain + API DexScreener.
- J2 : Landing + Stripe + 5 alertes exemples (LayerZero, Base).
- J3 : Poster X crypto + TikTok + 10 DMs influenceurs airdrop.

---

*Hype = acquisition facile, churn élevé → miser sur push + streak.*
