# 👑 13 — Franchise par Pays + VIP Telegram/Discord

> **Pitch :** Duplique SignauxX en **franchise par pays (1 500-3 000€ + 15% royalty)** et monétise l'audience via **VIP Telegram 19-39€/mois** avec bot auto invite/kick.

---

## 🎯 Pitch 1 phrase

Tu vends le playbook (code + infra + marketing) à un opérateur local par pays et encaisses licence + royalty + infra, pendant que le VIP Telegram génère du MRR immédiat.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Rôle franchise/VIP |
|--------|-----------------|--------------------|
| **Codebase clonable** | 157k LOC + Docker + GHCR | Kit franchise |
| **Better Auth + RBAC** | 5 rôles, `SubscriptionPlan` | Super-tenant (toi supervises) |
| **Distribution** | BullMQ + Socket.IO + Push + Resend | Signaux locaux |
| **Stripe / Mobile Money** | Prêt | Paiement local |
| **Bot VIP** | À créer (Telegraf, 1j) | Invite/kick auto via BullMQ |
| **Messagerie native** | `Conversation`/`Message` | Fallback si Telegram ban |
| **81 users prod** | Preuve | Pitch franchise |

> Combine **ancien docs 11 + 12** : franchise = B2B, VIP = B2C, même infra.

## 💰 Pricing recommandé

### Franchise

| Offre | Prix Afrique | Prix Europe/Dubaï | Inclus |
|-------|--------------|-------------------|--------|
| **Licence initiale** | **1 500€** | **3 000€** | Setup + formation 2j + kit marketing |
| **Royalty** | **15% MRR** | 15% | Mensuel |
| **Infra** | **100€/mois** | 150€/mois | Hébergement multi-VPS |
| **Durée** | 12 mois, renouvelable | | Non-concurrence pays |

### VIP Telegram/Discord

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| **VIP Essentiel** | **19€** | Signaux + résumé quotidien |
| **VIP Premium** | **39€** | + journal + live hebdo + entraide |
| **Annuel** | -20% | 182€ / 374€ |

## 📊 Exemple chiffré réaliste

### Franchise

| Pays | Licence | MRR opérateur | Royalty 15% | Infra | Ton revenu/mois/pays |
|------|---------|---------------|-------------|-------|----------------------|
| Bénin | 1 500€ one-shot | 2 000€ | 300€ | 100€ | **400€** |
| Sénégal | 1 500€ | 3 000€ | 450€ | 100€ | **550€** |
| CIV | 1 500€ | 2 500€ | 375€ | 100€ | **475€** |
| **Total 3 pays M12** | **4 500€** | | | | **1 425€/mois** |
| **5 pays × 3k MRR** | 7 500€ | 15 000€ GMV | 2 250€ | 500€ | **2 750€/mois** |

> **Réaliste M12 : 2-3 franchises → 600-1 350€/mois + 3-4,5k€ one-shot**.

### VIP Telegram (ton propre canal)

| Mois | Membres | Panier | MRR |
|------|---------|--------|-----|
| M1 | 50 | 19€ | **950€** |
| M3 | 100 | 22€ (mix) | **2 200€** |
| M6 | 150 | 24€ | **3 600€** |
| M12 | 300 | 29€ | **8 700€** (top coachs FR font 500-1 000 VIP) |

> **Réaliste démarrage : 30-50 VIP → 570-950€ MRR en 2 semaines** (bot 3j + 3 posts).
> **Stack franchise+VIP : 2 000-3 500€/mois M6**.

### Coûts

- Bot Telegraf : 1 jour dev, 0€ infra (VPS existant).
- Kit franchise : 2 jours (guide + scripts TikTok).
- Support : opérateur gère L1, toi L2 (2h/semaine).

## 🚀 3 étapes lancement (2-4 semaines / pays + 3-5j VIP)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. VIP d'abord (cash)** | Bot Telegraf (`/start` → vérif Stripe → invite lien unique → cron kick) + page `/vip` + webhook `subscription.updated` → BullMQ + 2 canaux (annonce + entraide) | VIP live | J1-J5 |
| **2. Pack franchise** | Contrat 1 page + script `clone-for-franchise.sh` (fork + env + `bj.signauxx.com`) + kit opérateur (guide marketing local + scripts TikTok + WhatsApp support) | Kit prêt | S2 |
| **3. Recruter** | Outbound LinkedIn 10 DMs/jour à influenceurs trading par pays + call sélection (KYC opérateur) + formation 2j + lancement co-brandé | 1er franchisé S4 | S3-S4 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Qualité opérateur (ternit marque)** | Critique | Sélection stricte + KYC + droit retrait + charte + audit trimestriel |
| **Dépendance Telegram (ban API)** | Élevé | Messagerie native fallback + export membres quotidien + canal Discord miroir |
| **Support VIP chronophage** | Moyen | Canal FAQ + modérateur (10h/semaine à 150 membres, 200€/mois Afrique) |
| **Concurrence VIP Telegram** | Moyen | Différenciation : plateforme + journal + affiliation Deriv (valeur vs Telegram pur) |

---

*Stacke avec `02-affiliation-broker-ib.md` (chaque VIP clique Deriv = +30% revenu) et `08-formation-infoproduit.md` (VIP → formation 97€).*
