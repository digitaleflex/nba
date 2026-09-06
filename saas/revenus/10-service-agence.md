# 🏢 10 — Service Agence / Dev Sur-Mesure

> **Pitch :** Clone la stack SignauxX en **2-3 semaines pour 5-15k€/projet** pour coachs, prop firms et fintechs qui veulent leur plateforme à leur nom.

---

## 🎯 Pitch 1 phrase

Tu vends ce que tu as déjà fait (89 j-h, 157k LOC) en prestation : le client paie pour ne pas attendre 4,5 mois, toi tu clones en 2 semaines.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Actif | Preuve | Valeur vente |
|-------|--------|--------------|
| **157k LOC, 603 fichiers** | `git log` 913 commits | Book agence |
| **29 models Prisma** | `schema.prisma` | Base clonable |
| **17 onglets admin** | `src/app/(admin)` | 22 j-h différenciant |
| **0 vulnérabilité** | `pnpm audit` | Argument sécurité |
| **8 releases** | v1.0→v2.5.0 | Preuve process |
| **Multi-VPS Tailscale** | GHCR + Docker | Infra prod |
| **Design system** | shadcn + Tailwind 4 + glassmorphisme | Premium |
| **81 users prod** | Prod live | Social proof |
| **estimation-valeur.md** | 18,5M FCFA / 158k€ agence | Justifie devis |

## 💰 Pricing recommandé

| Prestation | Prix Afrique | Prix Europe/Dubaï | Délai | Marge |
|------------|--------------|-------------------|-------|-------|
| **Clone SignauxX** (rebranding + domaine + contenu) | **5-8k€** | **10-15k€** | 2-3 sem | 85% |
| **Stack custom** (+ Mobile Money / WhatsApp / API trading) | **8-12k€** | **12-25k€** | 4-6 sem | 80% |
| **Retainer maintenance** | **500€/mois** | **1 000-1 500€/mois** | Mensuel | 90% |
| **Audit + devis** | 300€ (déductible) | 500€ | 2j | 100% |

> Positionnement : 2× moins cher qu'agence Europe (25-40k€), 2× plus cher que freelance junior → **justifié par 0 CVE + 8 releases**.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone

| Rythme | Prix moyen | Projets/an | CA annuel | Mensualisé |
|--------|------------|------------|-----------|------------|
| 1 projet / trimestre | 8 000€ | 4 | 32 000€ | **2 667€/mois** |
| 1 projet / 2 mois | 8 000€ | 6 | 48 000€ | **4 000€/mois** |
| + 2 retainers 750€ | | | +18 000€ | **+1 500€/mois** |

> **Réaliste démarrage (1h/j outbound) : 1 projet/trim → 2 500-4 000€/mois**.

### Scénario Europe/Dubaï

| Rythme | Prix | CA |
|--------|------|----|
| 1 projet/mois 12k€ | 12 000€ | **12 000€/mois** |
| + 3 retainers 1 000€ | | **3 000€/mois** |
| **Total** | | **15 000€/mois** |

> 1 deal Dubaï = 4 mois de MRR SaaS.

### Coûts

- Temps : 2-3 sem/projet (1 dev full-time).
- Closing : 1h/j LinkedIn/X (10 DMs/jour → 1 call/20 DMs → 1 deal/5 calls).

## 🚀 3 étapes lancement (1-2 semaines closing)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Vitrine** | Landing `/agence` + 3 études de cas (SignauxX = cas #1 : 89 j-h, 81 users, 0 CVE) + Calendly + template devis Notion + contrat (IP, maintenance, hors multi-tenant) | Site agence | J1-J3 |
| **2. Outbound** | 10 DMs/jour LinkedIn/X à coachs trading + fintechs + prop firms (script : « J'ai built X en 67j, je te le clone en 14j ») + 1 post/semaine « behind the code » | Pipeline 20 prospects | J4-J10 |
| **3. Closer** | Call 30 min + devis 48h + 50% upfront + clone (fork repo + rebranding + env + sous-domaine) | 1er deal S2 | S2 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Vends ton temps (non scalable)** | Élevé | Limiter 1 projet parallèle, 50% upfront, cadrer scope (pas de multi-tenant dans l'agence → protège SaaS) |
| **Scope creep** | Élevé | Contrat ferme : 3 révisions incluses, au-delà 80€/h ; pas de feature SaaS multi-tenant |
| **Cannibalise SaaS** | Moyen | Agence = single-tenant custom ; SaaS = multi-tenant mutualisé 49-299€/mois → 2 marchés distincts |
| **Impairs / retard** | Moyen | Buffer 1 sem, daily Loom client, GHCR déploiement continu |

---

*À croiser avec `01-licence-code-source.md` (licence = produit, agence = service) et `saas-models/01-white-label.md` (SaaS vs agence).*
