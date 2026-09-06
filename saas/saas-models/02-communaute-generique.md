# 👥 02 — SaaS Communauté Générique (Skool-like)

> **Pitch :** SaaS **Skool francophone** pour tout créateur (fitness, business, dev) — `Signal` → `Publication`, `Journal` → `Suivi`, pricing host 49/99/199€, commission 5%.

---

## 🎯 Concept

- **Positionnement** : Whop/Skool mais **francophone, moins cher, avec journal + KYC**.
- **Cible** : 10× trading — coachs fitness (49-99€/membre), business, langues, muscu. 100k+ créateurs FR, 500k+ Afrique francophone TikTok.
- **Douleur** : Telegram/WhatsApp = pas de paiement, pas de progression ; Skool = $99/host + anglophone.
- **Solution** : même infra que white-label, mais **vertical agnostique** — 0 refonte.

## 🧩 Ce que tu as déjà (modules exacts)

| Module NBA | Réutilisation communauté |
|------------|--------------------------|
| `Signal` → `Publication` (vidéo/PDF/programme) | Contenu |
| `SubscriptionPlan` + `AccessRequest` + Stripe | Monétisation |
| `Conversation`/`Message` + typing | Coaching 1to1 |
| `JournalSession` → `Suivi Progrès` | Habitude (poids, CA, leçon) |
| `KycDocument` | Vérif si besoin |
| BullMQ + Push + Resend | Notif contenu |
| Admin 17 onglets | MRR + modération |
| **Gap** | Idem white-label : multi-tenant `orgId` (4-6 sem) |

## 💰 Pricing (côté host = créateur)

| Plan | Prix/mois/host | Membres | Commission | Cible |
|------|----------------|---------|------------|-------|
| **Starter** | **49€** | 100 | 7% | Solo créateur |
| **Pro** | **99€** | 1 000 | 5% | Créateur scale |
| **Scale** | **199€** | Illimité | 3% | Agence / réseau |

> Skool $99/host illimité + 2,9% Stripe ; Whop 3-30% → **49€ +5% = entrée Afrique**.

## 📊 Exemple chiffré

| Hosts | Mix | MRR | Commission (GMV) | **Total MRR** |
|-------|-----|-----|------------------|---------------|
| 20 | 12×49 +6×99 +2×199 | 1 580€ | 600€ (12k GMV) | **2 180€** |
| 50 | 25×49 +15×99 +10×199 | 4 700€ | 2 000€ (40k GMV) | **6 700€** |
| 100 | 50×49 +30×99 +20×199 | 9 400€ | 5 000€ (100k GMV) | **14 400€** |

> TAM 10× trading → **50 hosts = 6,7k€ MRR** réaliste M12 (vs 50 coachs trading = même MRR mais plus dur à acquérir).

### Afrique vs Europe

- Afrique : 30 hosts fitness ×49€ = **1 470€ MRR** + achat Mobile Money.
- Europe : 20 hosts business ×99€ = **1 980€ MRR**.

## 🚀 GTM

| Canal | Action |
|-------|--------|
| LinkedIn/TikTok créateurs | 10 DMs/jour fitness/business |
| Partenariat Skool FR | « Skool trop cher ? Passe francophone » |
| Landing | « Crée ta communauté premium en 48h » + démo |
| Preuve | 81 users + 17 onglets + 0 CVE |

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Concurrence Skool/Whop | Niche francophone + prix + journal |
| Dispersion verticale | Choisir 1 vertical (fitness) pour GTM, puis élargir |
| Support multi-host | Doc + super-admin, 1 support /40 hosts |

## 🔄 Différence vs White-Label

| White-Label trading | Communauté générique |
|---------------------|----------------------|
| Niche, ARPU élevé, churn trading élevé | TAM 10×, ARPU moyen, churn plus faible (fitness = habitude) |
| Besoin perf trading | Besoin progression perso |
| **Recommandé si** tu connais trading | **Si** tu veux gros volume |

---

*Bundlable avec white-label : même code, 2 landings, 1 infra multi-tenant.*

## 📈 KPIs & succès

- Activation host <48h, membres/host >30, churn host <6%, NPS >40.
- Objectif M6 : 15 hosts Pro → 1 485€ MRR + preuve pour lever.

