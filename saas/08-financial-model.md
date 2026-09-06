# 💰 08 — Financial Model — Projections MRR 12 Mois

> **Modèle basé sur le pricing white-label (doc 03) : Starter 49€ / Pro 149€ / Scale 299€ + commission 10%/7%/5%.**
> 3 scénarios : prudent (10 coachs), base (50 coachs), ambitieux (150 coachs) à 12 mois. Valorisation 10× ARR.

---

## 📐 Hypothèses communes

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| **Mix tiers** | 40 % Starter / 45 % Pro / 15 % Scale | Pondération réaliste lancement — Pro cœur de gamme |
| **Membres / coach (moyenne)** | Starter 35 / Pro 180 / Scale 650 | Basé sur ICP 500–10k abonnés, conversion 10–20 % en payants |
| **Prix membre moyen** | 32 €/mois | Moyenne observée Telegram trading FR (25–49 €) |
| **Commission** | Starter 10 % / Pro 7 % / Scale 5 % | Doc 03 |
| **Stripe fees** | 1,5 % + 0,25 € (non comptés dans MRR SignauxX) | Payés par le coach |
| **Churn orgs mensuel** | 7 % prudent / 5 % base / 4 % ambitieux | SaaS vertical niche |
| **CAC** | 120 € / org | Outbound + influenceurs + ads (doc 06) |
| **Coût infra / org / mois** | 5 € | Neon + Redis + S3 mutualisés (doc 05) |
| **Coût support / org / mois** | 8 € | Amorti — 1 support / 50 orgs |
| **Coût fixe plateforme / mois** | 400 € | VPS, Neon, Resend, Sentry, domaine, backup B2 |

---

## 📊 Revenu par organisation (détail)

| Tier | Abonnement | Membres | Rev. coach (membres×32€) | Commission | **Rev. SignauxX / org / mois** |
|------|------------|---------|--------------------------|------------|-------------------------------|
| **Starter** | 49 € | 35 | 1 120 € | 112 € (10 %) | **161 €** |
| **Pro** | 149 € | 180 | 5 760 € | 403 € (7 %) | **552 €** |
| **Scale** | 299 € | 650 | 20 800 € | 1 040 € (5 %) | **1 339 €** |
| **Moyenne pondérée (40/45/15)** | — | — | — | — | **≈ 514 € / org / mois** |

> **Lecture** : 1 org Pro à 180 membres = 552 €/mois pour SignauxX. C'est le cœur du modèle — la commission dépasse l'abonnement.

---

## 📈 Scénario 1 — Prudent : 10 coachs à 12 mois

> Hypothèse : acquisition lente, 1 org / mois, churn 7 %.

| Mois | Orgs actives (fin mois) | MRR abonnements | MRR commissions | **MRR total** | **ARR** | Orgs cumul acquises |
|------|------------------------|-----------------|-----------------|---------------|---------|---------------------|
| M1 | 1 | 49 € | 45 € | **94 €** | 1 128 € | 1 |
| M3 | 3 | 267 € | 520 € | **787 €** | 9 444 € | 3 |
| M6 | 6 | 534 € | 1 040 € | **1 574 €** | 18 888 € | 7 |
| M9 | 8 | 712 € | 1 386 € | **2 098 €** | 25 176 € | 10 |
| **M12** | **10** | **890 €** | **1 733 €** | **2 623 €** | **31 476 €** | **13** |

**M12 : 10 orgs → 2 623 € MRR → 31,5k€ ARR → valo 10× = 315k€**

| Bilan M12 | Valeur |
|-----------|--------|
| MRR | 2 623 € |
| ARR | 31 476 € |
| Marge brute (après infra+support 13€/org) | ~2 493 € (95 %) |
| Marge après fixe 400€ | ~2 093 € |
| CAC total (13×120€) | 1 560 € |
| **Valorisation 10× ARR** | **~315 000 €** |

---

## 📈 Scénario 2 — Base : 50 coachs à 12 mois ⭐ SCÉNARIO CENTRAL

> Hypothèse : outbound soutenu (5 DMs/jour) + 2 influenceurs + ads M6, churn 5 %.

| Mois | Orgs actives | MRR abonnements | MRR commissions | **MRR total** | **ARR** | Orgs cumul acquises |
|------|-------------|-----------------|-----------------|---------------|---------|---------------------|
| M1 | 3 | 267 € | 520 € | **787 €** | 9 444 € | 3 |
| M3 | 12 | 1 068 € | 2 080 € | **3 148 €** | 37 776 € | 13 |
| M6 | 25 | 2 225 € | 4 333 € | **6 558 €** | 78 696 € | 28 |
| M9 | 38 | 3 382 € | 6 586 € | **9 968 €** | 119 616 € | 43 |
| **M12** | **50** | **4 450 €** | **8 666 €** | **13 116 €** | **157 392 €** | **58** |

**M12 : 50 orgs → 13 116 € MRR → 157k€ ARR → valo 10× = 1,57M€**

| Bilan M12 | Valeur |
|-----------|--------|
| MRR | 13 116 € |
| ARR | 157 392 € |
| Marge brute (après 13€/org) | ~12 466 € (95 %) |
| Marge après fixe 400€ | ~12 066 € |
| CAC total (58×120€) | 6 960 € |
| **Valorisation 10× ARR** | **~1 574 000 €** |
| **Valorisation vs. coût initial (18,5M FCFA ≈27,5k€)** | **×57** |

> 💡 **Lecture investisseur** : 50 coachs = 1 an d'outbound à 1 org/semaine. C'est le scénario le plus probable si l'exécution GTM (doc 06) est tenue.

---

## 📈 Scénario 3 — Ambitieux : 150 coachs à 12 mois

> Hypothèse : outbound + 5 influenceurs + ads 600€/mois + referral, churn 4 %, viralité coachs.

| Mois | Orgs actives | MRR abonnements | MRR commissions | **MRR total** | **ARR** | Orgs cumul acquises |
|------|-------------|-----------------|-----------------|---------------|---------|---------------------|
| M1 | 5 | 445 € | 866 € | **1 311 €** | 15 732 € | 5 |
| M3 | 30 | 2 670 € | 5 199 € | **7 869 €** | 94 428 € | 32 |
| M6 | 70 | 6 230 € | 12 132 € | **18 362 €** | 220 344 € | 75 |
| M9 | 110 | 9 790 € | 19 065 € | **28 855 €** | 346 260 € | 118 |
| **M12** | **150** | **13 350 €** | **25 998 €** | **39 348 €** | **472 176 €** | **162** |

**M12 : 150 orgs → 39 348 € MRR → 472k€ ARR → valo 10× = 4,72M€**

| Bilan M12 | Valeur |
|-----------|--------|
| MRR | 39 348 € |
| ARR | 472 176 € |
| Marge brute (après 13€/org) | ~37 398 € (95 %) |
| Marge après fixe 400€ | ~36 998 € |
| CAC total (162×120€) | 19 440 € |
| **Valorisation 10× ARR** | **~4 722 000 €** |

---

## 📊 Récapitulatif 12 mois — comparatif

| Métrique M12 | Prudent (10) | **Base (50)** | Ambitieux (150) |
|--------------|-------------|---------------|-----------------|
| **Orgs actives** | 10 | **50** | 150 |
| **Membres totaux** | ~2 000 | **~10 000** | ~30 000 |
| **MRR** | 2 623 € | **13 116 €** | 39 348 € |
| **ARR** | 31 476 € | **157 392 €** | 472 176 € |
| **Marge brute** | 2 493 €/mois | **12 466 €/mois** | 37 398 €/mois |
| **Valo 10× ARR** | 315k€ | **1,57M€** | 4,72M€ |
| **Coût infra+support** | 130 €/mois | **650 €/mois** | 1 950 €/mois |
| **CAC total** | 1 560 € | **6 960 €** | 19 440 € |

---

## 🎯 Seuil de rentabilité

| Charge mensuelle | Montant |
|------------------|---------|
| Infra + support (50 orgs) | 650 € |
| Fixe plateforme | 400 € |
| Fondateur (salaire minimal) | 1 500 € |
| Marketing (ads + outils) | 500 € |
| **Total charges** | **3 050 €/mois** |

| Seuil | Orgs nécessaires | MRR correspondant |
|-------|-----------------|-------------------|
| **Seuil rentabilité (charges couvertes)** | **6 orgs** (mix 40/45/15) | ~3 084 € |
| **Seuil salaire confort (5k€/mois)** | **10 orgs** | ~5 140 € |
| **Seuil 10k€ MRR** | **20 orgs** | ~10 280 € |

> **Le seuil de rentabilité est à 6 orgs** — atteignable dès M3 en scénario base. Le SaaS est rentable avant la fin du trimestre 1.

---

## 📉 Sensibilité — que se passe-t-il si...

| Variable | Impact sur MRR base (50 orgs) |
|----------|-------------------------------|
| Prix membre 25 € au lieu de 32 € | –12 % MRR (11 542 € au lieu de 13 116 €) |
| Churn 10 % au lieu de 5 % | –18 % orgs actives → ~10 770 € MRR |
| Mix 70 % Starter (au lieu de 40 %) | –35 % MRR (8 525 €) — **raison de pousser Pro** |
| Commission –2 pts (8/5/3 %) | –18 % MRR commissions → ~11 400 € |
| CAC 250 € au lieu de 120 € | Pas d'impact MRR, mais payback 2× plus long |

> **Levier le plus sensible : le mix tiers.** Chaque org qui passe de Starter (161€) à Pro (552€) = +391€ MRR. L'upsell Starter→Pro est la priorité commerciale.

---

## 💎 Valorisation — méthode 10× ARR

| Scénario | ARR M12 | Multiple | **Valorisation** | Multiple du coût initial (27,5k€) |
|----------|---------|----------|------------------|-----------------------------------|
| Prudent | 31k€ | 10× | **315k€** | ×11 |
| **Base** | **157k€** | **10×** | **1,57M€** | **×57** |
| Ambitieux | 472k€ | 10× | **4,72M€** | ×171 |

> **Multiple 10× ARR** : standard SaaS early-stage avec croissance >100 % YoY, churn <7 %, marges >90 %. Si croissance >200 % YoY, multiple 12–15× envisageable → base = 1,9–2,4M€.

---

## 🗓️ Projection MRR — courbe 12 mois (base)

```
MRR (€)
40k ┤
    │                                          ● M12 39k (ambitieux)
30k ┤                                    ● 28k
    │                              ● 18k
20k ┤                        ● 13k (base M12)
    │                  ● 9k
10k ┤            ● 6,5k
    │      ● 3,1k
 0k ┤● 0,7k
    └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬
      M1 M2 M3 M4 M5 M6 M7 M8 M9 M10 M11 M12
       ── prudent (10) ── base (50) ── ambitieux (150)
```

---

*Modèle du 6 septembre 2026 — hypothèses : mix 40/45/15, 32€/membre, churn 5 % base, CAC 120€, infra 5€+support 8€/org. À affiner avec données réelles dès M1.*
