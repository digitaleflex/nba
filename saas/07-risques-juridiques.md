# ⚖️ 07 — Risques Juridiques

> **Avertissement : ce document est une synthèse opérationnelle, pas un avis juridique.** Faire valider par un avocat (droit financier + numérique) avant le lancement commercial. Risque principal : **requalification en conseil en investissement financier (CIF) / PSI**.

---

## 🚨 Risque #1 — Conseil financier non régulé (AMF / ESMA)

### Le problème

En France et dans l'UE (directive MIFID II, règlement ESMA), **fournir des signaux de trading** (recommandations d'achat/vente d'instruments financiers) peut être qualifié de :

- **Conseil en investissement financier (CIF)** — statut régulé AMF (France), nécessite agrément, assurance RC pro, adhésion à une association professionnelle
- **Service d'investissement (PSI)** — si exécution ou réception-transmission d'ordres

SignauxX et ses coachs white-label opèrent dans cette zone grise.

### Niveau de risque par pivot

| Activité | Risque AMF/ESMA | Commentaire |
|----------|-----------------|-------------|
| Signaux avec prix d'entrée / SL / TP précis | 🔴 **Élevé** | Recommandation personnalisée = CIF probable |
| Analyses / idées de marché sans prix précis | 🟡 Moyen | Plus proche de l'information générale |
| Journal trading / éducation | 🟢 Faible | Pas de recommandation |
| Coach qui gère l'argent du membre | 🔴 **Critique** | Gestion sous mandat — agrément PSI obligatoire |

### Parades — ce que SignauxX DOIT faire

1. **Ne jamais se présenter comme conseiller financier** — SignauxX est un **hébergeur / éditeur d'outil**, pas un conseiller.
2. **Imposer un disclaimer visible** sur chaque signal, chaque page, chaque email (voir modèle ci-dessous).
3. **Faire signer aux coachs une clause de responsabilité** : le coach est seul responsable du contenu de ses signaux (voir CGU white-label).
4. **Interdire contractuellement** aux coachs de proposer de la gestion sous mandat via la plateforme.
5. **Recommander aux coachs** de se former / s'assurer / adhérer à une association CIF s'ils donnent des signaux avec prix précis — ou de reformuler en "idées éducatives".
6. **Prévoir un module de signalement** (déjà existant : `MessageReport`) étendu aux signaux litigieux.

> **Afrique francophone** : régulateurs locaux (CREPMF pour l'UEMOA, COSUMAF pour la CEMAC, AMMC Maroc, CMF Tunisie) — cadres moins stricts qu'AMF mais en durcissement. **Dubaï** : DFSA / SCA — très strict si ciblage résidents UAE. Adapter les disclaimers par juridiction.

---

## 📜 Disclaimers obligatoires — modèles à intégrer

### Disclaimer signal (affiché sous chaque signal)

> ⚠️ **Avertissement — Risque élevé**
>
> Les signaux publiés sur cette plateforme sont fournis à titre **informatif et éducatif uniquement**. Ils ne constituent **pas un conseil en investissement financier**, ni une recommandation personnalisée, ni une offre d'achat ou de vente d'instruments financiers.
>
> Le trading (Forex, indices, crypto-actifs) présente un **risque élevé de perte en capital**, pouvant excéder votre dépôt initial en cas d'effet de levier. **Ne tradez que ce que vous pouvez vous permettre de perdre.**
>
> Les performances passées ne préjugent pas des performances futures. Chaque membre est seul responsable de ses décisions de trading.
>
> **[Nom du coach]** est seul responsable du contenu de ses signaux. **SignauxX** agit en qualité d'hébergeur technique et ne saurait être tenu responsable des pertes éventuelles.

### Disclaimer landing / CGU (pied de page)

> SignauxX est une plateforme SaaS d'hébergement et de distribution de contenus. SignauxX ne fournit pas de conseils en investissement, ne gère pas de fonds et n'exécute pas d'ordres. SignauxX n'est pas agréée en tant que CIF, PSI ou PSAN. Vérifiez que votre coach dispose des agréments requis dans votre juridiction avant de suivre ses signaux.

### Disclaimer onboarding (case à cocher obligatoire)

> ☐ Je reconnais que les signaux sont fournis à titre informatif, que le trading comporte un risque de perte en capital, et que je suis seul responsable de mes décisions. J'ai lu l'avertissement risque.

---

## 📄 CGU / CGV — structure à rédiger par avocat

| Document | Contenu clé |
|----------|-------------|
| **CGU plateforme (membre)** | Objet, définitions, inscription, abonnement, résiliation, responsabilités, données perso, médiation |
| **CGU white-label (coach)** | Tout CGU membre + **clause coach** : responsabilité contenu signaux, interdiction gestion sous mandat, obligation disclaimer, modération, résiliation pour manquement |
| **CGV (vente abonnements)** | Prix, paiement (Stripe), rétractation (14 jours UE sauf service déjà exécuté), renouvellement, impayés |
| **Politique de confidentialité** | RGPD : base légale, durées conservation, droits, DPO, transferts hors UE (Neon US ?), cookies |
| **Mentions légales** | Éditeur, hébergeur (VPS), contact, RCS |
| **Contrat white-label** | Entre SignauxX et chaque coach : licence SaaS, commission, support, SLA, propriété données membres, réversibilité (export) |

---

## 🏷️ Responsabilité — qui est responsable de quoi ?

| Acteur | Responsabilité | Base juridique |
|--------|----------------|----------------|
| **SignauxX (plateforme)** | Hébergeur technique (LCEN art. 6) — obligation de moyens, retrait prompt des contenus illicites signalés, sécurité données (RGPD art. 32) | LCEN, RGPD, DSA (si >50 salariés) |
| **Coach (éditeur)** | Éditeur du contenu — seul responsable de ses signaux, de ses promesses commerciales, de son statut régulé | Code monétaire et financier, Code de commerce |
| **Membre (trader)** | Seul responsable de ses décisions de trading | Principe général |

> **Jurisprudence clé** : l'hébergeur qui **sélectionne, promeut ou monétise activement** le contenu peut être requalifié en éditeur. SignauxX doit rester **neutre** : ne pas mettre en avant un coach ("meilleur signaux"), ne pas garantir de performance, ne pas toucher aux signaux.

---

## 🔒 RGPD & données — 6 obligations

| # | Obligation | Statut NBA actuel | Action SaaS |
|---|------------|-------------------|-------------|
| 1 | **Base légale** | Consentement + contrat (auth, abonnement) | Ajouter base légale par org (coach = responsable traitement, SignauxX = sous-traitant) |
| 2 | **DPA (sous-traitance)** | Manque | Rédiger DPA SignauxX ↔ coach (art. 28 RGPD) |
| 3 | **Droits membres** | Partiel (suppression soft `deletedAt`) | Ajouter export + suppression définitive par org (`/api/orgs/[id]/gdpr/*`) |
| 4 | **Durées conservation** | `AuditLog`, `SecurityEvent` conservés | Définir durées par catégorie (ex: KYC 5 ans, logs 13 mois) |
| 5 | **Transferts hors UE** | Neon (US), Resend (US), B2 (US) | Mentionner dans privacy + envisager Neon EU region + clauses SCC |
| 6 | **Registre traitement** | Manque | Créer registre (art. 30) — 1 fiche par org type |

---

## 🌍 Spécificités par juridiction

| Juridiction | Régulateur | Point d'attention |
|-------------|------------|-------------------|
| **France / UE** | AMF / ESMA | CIF/PSI, DSA, RGPD, droit rétractation 14j |
| **UEMOA (Sénégal, Côte d'Ivoire, Bénin, Togo, Mali)** | CREPMF | Cadre OHADA + régulation régionale — vérifier agrément local si le coach y est établi |
| **CEMAC (Cameroun, Gabon)** | COSUMAF | Idem — BVMAC |
| **Maroc** | AMMC | Agrément requis pour conseil financier |
| **Dubaï / UAE** | DFSA (DIFC), SCA, FSRA (ADGM) | Très strict — ne pas cibler résidents UAE sans licence ; viser Dubaï comme hub mais facturer en Europe si possible |
| **UK** | FCA | Si coach UK — régime distinct post-Brexit |

---

## ✅ Checklist juridique avant lancement

- [ ] Avocat droit financier : valider disclaimers + CGU white-label + clause responsabilité coach
- [ ] Avocat RGPD : valider privacy + DPA + registre + durées
- [ ] Intégrer disclaimers dans : `Signal` card, `src/app/(auth)/*`, emails, landing
- [ ] Case à cocher risque obligatoire à l'onboarding (bloquant)
- [ ] CGU/CGV/privacy publiées + versionnées + horodatées
- [ ] Contrat white-label signé par chaque coach pilote
- [ ] DPA signé avec chaque coach (annexe contrat)
- [ ] Vérifier région Neon (EU vs US) + mention transferts
- [ ] Activer modération signalement signaux + procédure retrait <24h
- [ ] Assurance RC pro / cyber (devis) — exigée pour lever des fonds

---

*Document du 6 septembre 2026 — synthèse opérationnelle. Validation avocat indispensable avant facturation du premier coach.*
