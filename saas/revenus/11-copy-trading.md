# 🔄 11 — Copy Trading / PAMM / MAM

> **Pitch :** Permets à tes membres de **copier automatiquement** tes trades (ou ceux d'un trader star) via API Deriv/Binance et prélève **25% de perf fee**.

---

## 🎯 Pitch 1 phrase

Tu transformes ta perf vérifiable (`Trade` + `JournalSession`) en rente : chaque euro gagné par un copieur te rapporte 25 centimes, sans gérer les fonds.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Rôle copy |
|--------|-----------------|-----------|
| **Trade** | `Trade` (entry, exit, PnL, preuve) | Historique vérifiable |
| **JournalSession** | `JournalSession` + `DailyReflection` | Transparence perf |
| **BrokerVerification** | Vidéo + statut | Preuve compte réel |
| **Abonnements** | `SubscriptionPlan` (plan Copy 29€) | Double monétisation |
| **Temps réel** | Socket.IO + Push | Notif « trade copié » |
| **Admin** | Leaderboard potentiel | Classement traders |
| **81 users** | Base | Premiers copieurs |

## 💰 Pricing recommandé

| Modèle | Prix | Ta part | Risque juridique |
|--------|------|---------|------------------|
| **Perf fee** | **25% des gains** | 25% (standard eToro 20-30%) | Élevé (voir risques) |
| **Abonnement copieur** | **29€/mois** | 100% | Faible |
| **Hybride (reco)** | 29€ + 25% perf | Mix | Moyen |
| **PAMM léger** | Compte maître Deriv + répartition auto | 25% | Élevé |

> Benchmark : eToro 0% perf mais spread, Darwinex 20%, Myfxbook Autotrade 25% → **25% = standard**.

## 📊 Exemple chiffré réaliste

### Hypothèses

- Capital moyen copieur : **300€ (Afrique) / 500€ (Europe)**
- Perf moyenne trader star : **5-8% / mois** (réaliste, pas 50%)
- Perf fee 25%

| Copieurs | Capital | Perf 8% | Profit total | Ta fee 25% | + Abos 29€ | **Total/mois** |
|----------|---------|---------|--------------|------------|------------|----------------|
| 20 (M1) | 300€ | 8% | 480€ | **120€** | 580€ | **700€** |
| 50 (M3) | 400€ | 8% | 1 600€ | **400€** | 1 450€ | **1 850€** |
| 100 (M6) | 500€ | 8% | 4 000€ | **1 000€** | 2 900€ | **3 900€** |
| 200 (M12) | 500€ | 8% | 8 000€ | **2 000€** | 5 800€ | **7 800€/mois** |

> **Réaliste M6 : 30-50 copieurs → 500-1 500€/mois** (bouche-à-oreille si perf >5% vérifiée).
> **Si perf négative 1 mois** : 0€ fee → afficher drawdown honnête, churn 15-20%.

### Scénario Europe (capital 1 000€)

- 50 copieurs × 1 000€ × 8% × 25% = **1 000€ fee** + 1 450€ abos = **2 450€/mois**.

### Coûts

- Intégration API Deriv/Binance : 1-2 sem (1 dev).
- Juridique : CGU + disclaimer 500€ (avocat).
- Infra : 0€ (API only, tu ne touches pas fonds).

## 🚀 3 étapes lancement (4-6 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Intégration** | API Deriv (OAuth + `POST /copy` — docs ouvertes) ou Binance Copy API + page `/copy-trading` (leaderboard winrate/drawdown/AUM + bouton Copier) | POC copy | S1-S2 |
| **2. Juridique** | CGU copy trading + disclaimer béton + KYC renforcé (voir `07-risques-juridiques.md`) + partenariat broker régulé qui porte responsabilité (Deriv PAMM déjà régulé) | Cadre légal | S2-S3 |
| **3. Lancement** | Onboarding 20 copieurs pilotes (tes VIP) + preuve perf 3 mois + vidéo « comment copier » + notif push chaque trade | 20 copieurs M1 | S4-S6 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Juridique AMF/ESMA (critique)** | 🔴 Critique | Ne jamais toucher fonds (API only), disclaimer « pas conseil financier », partenariat broker régulé porteur, CGU spécifique, idéalement avis juriste 500€ |
| **Perf négative → churn + plaintes** | Élevé | Afficher drawdown honnête, pas de promesse, historique `Trade` vérifiable, stop-loss auto copieur |
| **Dépendance API Deriv/Binance** | Moyen | Support 2 brokers dès M3, fallback manuel (signal → copieur exécute) |
| **Charge support copieurs** | Moyen | FAQ + canal Telegram dédié + bot ; limiter 100 copieurs avant embauche modérateur |

> **Recommandation : lancer après 100 VIP + 3 mois perf vérifiable**. C'est le levier le plus rentable mais le plus risqué.

---

*À croiser avec `07-risques-juridiques.md` (obligatoire) et `12-data-analytics.md` (perf data = preuve).*
