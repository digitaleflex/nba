# SignauxX — Exposé complet de la plateforme

> **Document de présentation** — version 1.0, novembre 2026
> **Périmètre** : code source actuel, schéma Prisma, routes API et dossier produit.
> **Chiffres d'usage** : dossier de septembre 2026 (81 utilisateurs en production, 8 releases, 913 commits).
> **Nom interne** : NeverBrokeAgain (NBA). **Nom commercial** : SignauxX.
> **Support de présentation** : `SIGNAUXX-DECK.html` (16 slides, navigation clavier) et `SIGNAUXX-DECK.pdf` (version PDF prête à projeter).
> **Version WhatsApp** : `SIGNAUXX-WHATSAPP.txt` (4 messages prêts à copier-coller, centrés trader).

### Comment utiliser ce document

| Usage | Sections à privilégier |
|---|---|
| **Exposé de 10 minutes** | 1, 11, 15 |
| **Exposé de 30 minutes** | 1, 2, 3, 5, 6, 11, 12, 15 |
| **Présentation technique** | 7, 8, 9, 10, 16.3 |
| **Dossier commercial / investisseur** | 1, 11, 13, 14, 15 |
| **Formation d'un nouvel admin** | 7, 9, 16.1, 16.3 |

---

## Sommaire

1. [En une page](#1-en-une-page)
2. [Le problème que SignauxX résout](#2-le-problème-que-signauxx-résout)
3. [La réponse en quatre piliers](#3-la-réponse-en-quatre-piliers)
4. [Carte fonctionnelle de la plateforme](#4-carte-fonctionnelle-de-la-plateforme)
5. [Le parcours membre, étape par étape](#5-le-parcours-membre-étape-par-étape)
6. [Toutes les fonctionnalités côté trader](#6-toutes-les-fonctionnalités-côté-trader)
7. [Toutes les fonctionnalités côté admin](#7-toutes-les-fonctionnalités-côté-admin)
8. [Le moteur de signaux](#8-le-moteur-de-signaux)
9. [Sécurité, conformité et anti-fraude](#9-sécurité-conformité-et-anti-fraude)
10. [Architecture technique et exploitation](#10-architecture-technique-et-exploitation)
11. [Les avantages concrets pour un trader](#11-les-avantages-concrets-pour-un-trader)
12. [SignauxX vs un groupe Telegram / Discord](#12-signauxx-vs-un-groupe-telegram--discord)
13. [Ce que la plateforme apporte à l'opérateur](#13-ce-que-la-plateforme-apporte-à-lopérateur)
14. [Limites et points de vigilance](#14-limites-et-points-de-vigilance)
15. [Le pitch en 60 secondes](#15-le-pitch-en-60-secondes)
16. [Annexes](#16-annexes)

---

## 1. En une page

**SignauxX** est une plateforme de signaux de trading qui remplace le groupe Telegram désorganisé par un véritable produit :

- un **espace membre sécurisé** ;
- un **flux de signaux structuré, filtrable et traçable** ;
- un **journal de trading** avec statistiques automatiques ;
- un **module de coaching et de discipline** ;
- une **messagerie intégrée** ;
- une **console d'administration complète** pour piloter membres, KYC, abonnements, signaux et sécurité.

### La promesse

> Recevoir les bons signaux, au bon moment, sur le bon support — puis mesurer ce que l'on en fait.

### Les trois piliers

| Pilier | Ce qu'il apporte |
|---|---|
| **Distribution fiable** | Temps réel + in-app + email + push, avec suivi de livraison par canal |
| **Espace trader** | Inbox, favoris, archives, journal, statistiques, coaching, messagerie |
| **Back-office** | KYC, broker, plans, segmentation, anti-fraude, audit, support, pilotage |

### Chiffres clés

| Métrique | Valeur |
|---|---|
| Sous-onglets admin | **19**, regroupés en 5 contextes (dont 2 réservés au SUPER_ADMIN) |
| Routes API | **149** au total : 86 admin, 40 dashboard, 23 onboarding/auth/public/docs/files/push/sessions/webhooks |
| Modèles Prisma | **41** modèles, 19 enums |
| Rôles / permissions | **5 rôles**, **11 permissions** granulaires |
| Plans d'abonnement | **6** (Forex, Deriv, combinés, Pro) |
| Canaux de diffusion | **In-app + temps réel WebSocket + email + push** |
| Releases | **8** (v1.0.0 → v2.5.0) |
| Volume de code | **~157 000 lignes** (dossier sept. 2026) |
| Utilisateurs en production | **81** (76 membres + 5 admins, sept. 2026) |
| Vulnérabilités connues | **0** au moment de l'audit (sept. 2026) |

### Le différenciateur

Ce n'est **ni un bot Telegram**, **ni un simple site de signaux**. C'est une plateforme complète qui traite le signal comme un produit : contenu structuré, audience segmentée, diffusion trackée, lecture prouvée, historique, statistiques et accompagnement du trader.

---

## 2. Le problème que SignauxX résout

### Côté trader

| Problème vécu | Conséquence |
|---|---|
| Les signaux arrivent dans 3 à 10 groupes Telegram/WhatsApp/Discord | On en rate, on scrolle, on perd le fil |
| Les messages sont noyés dans le bruit | Impossible de retrouver un signal précis |
| Aucune structure commune (pas de SL/TP, pas de contexte) | Il faut interpréter, donc risquer une erreur |
| Aucune preuve de réception | « Je ne l'ai pas reçu » est invérifiable |
| Aucun suivi de ses propres résultats | Impossible de savoir si l'on progresse vraiment |
| Aucune discipline formalisée | Revenge trading, sur-trading, émotions |
| Groupes non vérifiés, faux gourous, scams | Perte de confiance et d'argent |
| Aucun support fiable | Problème = personne à qui parler |

### Côté opérateur

| Problème | Conséquence |
|---|---|
| Gestion manuelle des membres | Temps perdu, erreurs, oublis |
| Aucune segmentation par plan | Tout le monde reçoit tout, ou personne ne reçoit rien |
| Aucun suivi de délivrabilité | Impossible de savoir si le signal est bien arrivé |
| Aucun contrôle d'accès fin | Fuites, partages de compte, non-payeurs |
| Aucune traçabilité | Impossible d'auditer une décision |
| Aucune protection anti-fraude | Multi-comptes, IP suspectes, abus |
| Aucune donnée d'usage | Impossible de piloter la rétention ou le revenu |
| Support éparpillé | Messages perdus, insatisfaction |

### La conviction de SignauxX

Un signal ne vaut que si **quatre conditions** sont réunies :

1. il est **reçu** ;
2. il est **compris** ;
3. il est **exploité** ;
4. son effet est **mesuré**.

La plateforme est construite autour de ces quatre étapes — pas seulement autour de l'envoi d'un message.

---

## 3. La réponse en quatre piliers

### Pilier 1 — Centraliser

Un seul endroit pour les signaux, les annonces, les messages, l'abonnement, les vérifications et le support. Fini les cinq applications ouvertes en permanence.

### Pilier 2 — Structurer

Chaque signal a un contenu, une audience, un statut, une date, des images, des niveaux SL/TP pouvant être précisés dans le contenu, un historique de versions et un suivi de lecture. Chaque trade a une paire, une direction, un résultat, un PnL calculé, un setup, une stratégie, une émotion et des tags.

### Pilier 3 — Prouver

La plateforme trace :

- qui a reçu quoi (notification, email, push) ;
- qui a ouvert (événements Resend : delivered, opened, bounced, complained) ;
- qui a lu (SignalRead) ;
- qui a mis en favori ou archivé ;
- qui a demandé / obtenu un accès (AccessRequest) ;
- qui a fait quoi côté admin (AuditLog avec chaîne d'intégrité).

### Pilier 4 — Accompagner

Le trader ne reçoit pas seulement un signal : il dispose d'un journal, de statistiques, de réflexions quotidiennes, de séries de discipline, de missions, de messages et d'un support. L'admin peut consulter les journaux et coacher.

---

## 4. Carte fonctionnelle de la plateforme

```
                              ┌──────────────────────────┐
                              │        SIGNAUXX          │
                              └────────────┬─────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          │                                │                                │
   ESPACE PUBLIC                    ESPACE MEMBRE                    CONSOLE ADMIN
   ─────────────                    ─────────────                    ─────────────
   • Login / Register               • Dashboard                      • 19 sous-onglets
   • Mot de passe oublié            • Mes signaux                    • 5 contextes
   • Vérification email (OTP)       • Détail signal                  • KYC / Broker
   • CGU / Confidentialité          • Journal de trading             • Membres / Plans
   • Avertissement risques          • Statistiques / Réflexions      • Signaux / Diffusion
                                    • Messagerie                     • Audit / Sécurité
                                    • Notifications                  • Anti-fraude
                                    • Abonnement                     • Support / Modération
                                    • Profil / Sécurité              • Files / Cache
                                    • Appareils / Sessions           • Tracker / Webhooks
                                    • Support / Bugs                 • Console développeur
```

### Les trois portes d'entrée

| Porte | Public | Objectif |
|---|---|---|
| **Publique** | Visiteurs, prospects | S'inscrire, se connecter, consulter les documents légaux |
| **Membre** | Traders validés | Recevoir les signaux, journaliser, échanger, gérer son compte |
| **Admin** | ADMIN / SUPER_ADMIN / KYC_AGENT / SUPPORT_AGENT | Valider, diffuser, modérer, piloter, auditer |

### Les 5 contextes admin

| Contexte | Onglets | Question à laquelle il répond |
|---|---|---|
| **Surveiller** | Tableau de bord, Analytics, Revenus, Appareils | « Que se passe-t-il ? » |
| **Décider** | Demandes, Membres, Utilisateurs, KYC, Broker | « Qui valider, qui suspendre ? » |
| **Communiquer** | Signaux, E-mails, Notifications, Formation | « Quoi envoyer, à qui ? » |
| **Auditer** | Bugs, Modération, Sécurité, Anti-Fraude | « Qui abuse, que s'est-il passé ? » |
| **Système** | Paramètres, Cron Jobs | « Comment configurer la plateforme ? » |

---

## 5. Le parcours membre, étape par étape

### Étape 1 — Inscription

Le visiteur crée son compte avec :

- nom ;
- email ;
- mot de passe ;
- téléphone / WhatsApp (selon le formulaire) ;
- acceptation des conditions.

L'authentification repose sur **Better Auth** : sessions persistantes, cookies httpOnly/secure/sameSite, protection CSRF, gestion des sessions et des appareils.

### Étape 2 — Vérification de l'email

Un code **OTP à 6 chiffres** est envoyé par email. L'utilisateur le saisit ou le colle. Tant que l'email n'est pas vérifié, l'accès au dashboard reste bloqué.

**Pourquoi c'est important** : cela limite les faux comptes, les inscriptions jetables et les usurpations.

### Étape 3 — Onboarding en trois temps

Le parcours d'onboarding est volontairement simple :

```
Email vérifié  ──▶  KYC (pièce d'identité)  ──▶  Broker (compte de trading)
```

#### 3.1 KYC — vérification d'identité

Types de documents acceptés :

- Carte nationale d'identité (recto + verso) ;
- Passeport (une face) ;
- Permis de conduire (recto + verso).

Formats : JPEG, PNG, WebP, PDF. Les fichiers sont contrôlés (type MIME, magic bytes, taille), stockés de manière privée et servis via une route protégée. Les documents temporaires sont nettoyés automatiquement après **7 jours** (politique RGPD).

#### 3.2 Broker — vérification du compte de trading

Le membre déclare :

- le nom du broker (Deriv, MT4, MT5, autre — champ libre) ;
- son numéro de compte ;
- une **courte vidéo de vérification** (MP4/WebM).

L'admin peut visionner la vidéo, approuver ou rejeter avec un motif. Le membre reçoit un email de décision.

**Pourquoi c'est important** : la vérification du broker relie le membre à un compte réel, limite les multi-comptes et renforce la crédibilité de la communauté.

### Étape 4 — Choix du plan et demande d'accès

Le membre choisit un plan parmi six :

| Plan | Marché |
|---|---|
| Signals X Forex | Forex |
| Signals X Deriv | Deriv / indices |
| Signals X Forex + Deriv | Les deux |
| Signals X Pro Forex | Forex, niveau Pro |
| Signals X Pro Deriv | Deriv, niveau Pro |
| Signals X Pro Forex + Deriv | Les deux, niveau Pro |

Chaque plan a une durée (30 jours par défaut), un prix configurable, une description et des features. La demande crée une **AccessRequest** au statut `PENDING`. L'admin l'approuve, la rejette, la suspend ou la révoque. Le membre reçoit un email à chaque décision.

**Point important** : dans le code actuel, l'accès est validé manuellement par l'équipe (pas de passerelle de paiement en ligne intégrée). Le prix et les features sont administrables depuis la console.

### Étape 5 — Réception des signaux

Une fois l'accès approuvé, le membre reçoit les signaux :

- **en temps réel** dans l'application (WebSocket) ;
- **in-app** via la cloche de notifications ;
- **par email** (Resend) ;
- **par push** (Web Push) sur navigateur / PWA.

Chaque signal est créé pour une ou plusieurs audiences (plans). Le membre ne voit que les signaux de ses plans, sauf override administrateur.

### Étape 6 — Exploitation du signal

Le membre peut :

- ouvrir le détail du signal ;
- lire le contenu markdown et les images (jusqu'à 5) ;
- repérer les niveaux SL/TP indiqués dans le contenu, le cas échéant ;
- copier le contenu en un clic ;
- marquer comme lu ;
- mettre en favori ;
- archiver ;
- retrouver l'historique via la recherche et les filtres.

### Étape 7 — Journalisation et progression

Après le trade, le membre enregistre :

- la paire, la direction, le résultat ;
- les prix d'entrée/sortie, le lot, le spread, la commission, le swap ;
- le stop loss, le take profit, le risk % ;
- la stratégie, le setup, l'émotion, la confiance, les tags, la note.

La plateforme calcule automatiquement le **PnL**, le **R:R**, les statistiques, les séries et les graphiques.

### Étape 8 — Discipline et coaching

Chaque jour, le membre peut :

- écrire une **réflexion** (note 1–10, humeur, note libre) ;
- suivre sa **série de discipline** ;
- consulter ses **missions** et **paliers** ;
- recevoir un **rappel quotidien** ;
- échanger avec l'admin / le coach via la messagerie.

L'admin dispose d'une vue **Coaching** pour consulter les journaux, les trades et les setups des membres.

---

## 6. Toutes les fonctionnalités côté trader

### 6.1 Authentification et compte

- Inscription email + mot de passe.
- Vérification email par OTP à 6 chiffres.
- Mot de passe oublié + réinitialisation sécurisée par token.
- Sessions persistantes (`rememberMe` par défaut).
- Gestion des sessions actives : liste, révocation.
- Gestion des appareils : nom, type, OS, navigateur, IP, dernière activité, confiance, révocation.
- Vérification d'un nouvel appareil par code email.
- Changement d'email avec vérification du mot de passe et notification de confirmation à l'ancienne adresse.
- Changement de mot de passe.
- Suppression de compte (avec confirmation et traitement RGPD).
- Export des données personnelles.

**Pourquoi ça compte** : le compte contient des signaux payants et des données personnelles. Le trader doit pouvoir reprendre la main à tout moment, notamment en cas de perte ou de vol d'un appareil.

### 6.2 Profil et préférences

- Nom, email, téléphone, WhatsApp.
- Photo de profil (upload, suppression).
- Langue : français, anglais, arabe.
- Fuseau horaire (détection automatique + réglage manuel).
- Son de notification (bibliothèque de 17 sons).
- Volume du son.
- Préférences de notifications par type :
  - signaux ;
  - KYC ;
  - broker ;
  - abonnement ;
  - sécurité ;
  - annonces système ;
  - messages ;
- **Heures silencieuses** (quiet hours) : les notifications push sont retenues pendant la plage définie ; les emails restent envoyés.

**Pourquoi ça compte** : un trader n'a pas les mêmes besoins à 3 h du matin et à 14 h. Il peut couper le bruit sans couper l'essentiel.

### 6.3 Abonnement et accès

- Page abonnement avec :
  - plan actif ;
  - date de début et date d'échéance ;
  - jours restants ;
  - statut (actif, expiré, en attente, rejeté) ;
  - features du plan ;
  - lien de renouvellement / paiement si configuré dans les features ;
  - historique des demandes ;
  - demande de changement de plan.
- Statuts gérés : `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `REVOKED`.
- Emails automatiques lors d'une décision individuelle : approbation, rejet, suspension, révocation, changement de plan. Les actions en lot mettent à jour l'accès ; vérifier l'envoi d'email selon le mode utilisé.
- Accès aux signaux conditionné à un `AccessRequest` approuvé ou à un override admin. La page abonnement calcule l'échéance à partir de la date de validation et de la durée du plan ; un script de relance prévient les membres expirés.

**Pourquoi ça compte** : le trader sait exactement ce qu'il a payé, jusqu'à quand, et ce qu'il peut recevoir.

### 6.4 Mes signaux — l'inbox premium

- Flux temps réel des signaux publiés.
- Filtres :
  - tous ;
  - non lus ;
  - aujourd'hui ;
  - cette semaine ;
  - Forex ;
  - Indices / Deriv ;
  - Forex + Indices ;
  - favoris ;
  - archives.
- Recherche plein texte avec debounce.
- Badge de non-lus.
- Compteur de nouveaux signaux.
- Aperçu des images (jusqu'à 2 vignettes + compteur).
- Favoris (étoile).
- Archives.
- Pagination / chargement progressif.
- Vue mobile avec feuille de filtres dédiée.
- Abonnement WebSocket pour l'arrivée instantanée d'un signal.
- Guide « premier signal » accessible depuis le détail.

**Pourquoi ça compte** : c'est le cœur de l'expérience quotidienne. Un trader doit retrouver un signal en quelques secondes, même trois semaines plus tard.

### 6.5 Détail d'un signal

- Contenu enrichi (markdown sécurisé, anti-XSS).
- Images du signal (jusqu'à 5) avec viewer.
- Niveaux SL/TP indiqués dans le contenu, le cas échéant.
- Métadonnées : date de publication, auteur, audience, badge « Signal officiel ».
- Copie du contenu, partage du lien et impression.
- Favori / archive.
- Enregistrement automatique de la lecture (SignalRead, avec compteur de vues).
- Accès contrôlé : un membre ne peut ouvrir que les signaux de ses plans.
- Historique de versions côté données (SignalVersion).

**Pourquoi ça compte** : le signal n'est pas un message qui défile. C'est une fiche consultable, partageable et exploitable.

### 6.6 Journal de trading

Le journal est un module complet, pas un simple calepin.

#### Saisie d'un trade

- Paire (EURUSD, XAUUSD, etc.).
- Direction : achat / vente.
- Résultat : gagné / perdu / break-even.
- Prix d'entrée et de sortie.
- Stop loss et take profit.
- Taille de lot.
- Spread, commission, swap.
- Risk %.
- PnL calculé automatiquement (ou saisi).
- Stratégie : scalping, day trading, swing, position.
- Setup : breakout, pullback, reversal, range, trend, autre.
- Émotion : confiant, neutre, anxieux, peur, gourmand, revenge.
- Confiance (score).
- Tags libres.
- Note libre.
- Date du trade.
- Brouillon sauvegardé automatiquement.
- Validation intelligente : incohérence entre résultat et PnL signalée.

#### Sessions de trading

- Démarrer / arrêter une session.
- Chronomètre en direct.
- Nombre de trades de la session.
- Résumé à la clôture : nombre de trades, PnL total.
- Rattachement des trades à la session.
- Backfill des sessions orphelines.

#### Statistiques

- PnL total.
- Win rate.
- Nombre de trades (gagnants / perdants).
- Série actuelle et record de victoires.
- Série actuelle et record de défaites.
- Drawdown maximum.
- Expectancy (en R).
- Profit factor.
- Gain moyen.
- Perte moyenne.
- Ratio risque/récompense moyen.
- PnL cumulé (graphique).
- Win/Loss par jour (graphique).
- Performance par paire.
- Performance par émotion.
- Évolution du trader (graphique multi-séries).
- Filtres de période : tout, 30 jours, 7 jours.

#### Réflexions

- Note quotidienne de 1 à 10.
- Humeur.
- Nombre de trades, victoires, pertes.
- PnL du jour.
- Note libre.
- Historique des réflexions.
- Rappel quotidien (nudge).
- Série de discipline.
- Missions et paliers.
- Rapport hebdomadaire par email.

**Pourquoi ça compte** : la plupart des traders perdent non pas parce qu'ils manquent de signaux, mais parce qu'ils ne mesurent pas ce qu'ils font. Le journal transforme l'activité en données.

### 6.7 Coaching et discipline

- Vue d'ensemble du journal.
- Sessions guidées.
- Guide du premier trade.
- Guide des statistiques.
- Guide de la réflexion.
- Missions quotidiennes / hebdomadaires.
- Paliers de progression.
- Série de discipline.
- Rappels.
- Accès admin aux journaux pour coacher.
- Messages directs avec l'équipe.
- Rapport hebdomadaire.

**Pourquoi ça compte** : le trader n'est pas seul face à ses chiffres. Il est accompagné, relancé et corrigé.

### 6.8 Messagerie

- Conversations 1-1 avec l'admin / le support.
- Envoi groupé côté admin : un message individuel est créé pour chaque membre ciblé (pas de groupe public).
- Temps réel via WebSocket.
- Texte, images, vidéos.
- Pièces jointes avec type, taille et nom.
- Réponses citées.
- Réactions emoji.
- Édition et suppression de message.
- Accusés de lecture.
- Compteur de non-lus.
- Notifications in-app, push et email.
- Signalement de message (anti-abus).
- Modération côté admin.
- Blocage des pièces jointes non conformes.

**Pourquoi ça compte** : le trader peut poser une question sans quitter la plateforme, et l'admin garde une trace de l'échange.

### 6.9 Notifications

- Cloche de notifications avec badge.
- Liste des notifications.
- Marquage lu / non lu.
- Tout marquer comme lu.
- Suppression.
- Filtres par type.
- Push navigateur / PWA.
- Email transactionnel.
- Préférences par type.
- Heures silencieuses.
- Son personnalisé.
- Notification en arrière-plan.
- Livraison suivie (NotificationDelivery).

**Pourquoi ça compte** : un signal non vu est un signal perdu. La plateforme multiplie les canaux sans noyer le trader.

### 6.10 Sécurité du compte

- Sessions actives : liste, appareil, IP, date, révocation.
- Appareils : liste, renommage, confiance, révocation.
- Vérification d'un nouvel appareil.
- Événements de sécurité.
- Alertes email : nouvel appareil, nouvelle localisation, activité suspecte.
- Déconnexion de tous les autres appareils.
- Export des données.
- Suppression du compte.
- Historique des connexions.

**Pourquoi ça compte** : un compte de signaux peut valoir cher. La plateforme permet de détecter et de couper un accès non autorisé.

### 6.11 Support et retours

- Page support avec sujet + message.
- Brouillon sauvegardé.
- Ticket visible côté admin.
- Réponse de l'équipe.
- Signalement de bug avec :
  - titre ;
  - description ;
  - sévérité ;
  - étapes de reproduction ;
  - contexte technique (page, navigateur, plateforme, écran, langue, fuseau, IP).
- Suivi du statut : ouvert, en cours, corrigé, fermé.
- Note admin.

**Pourquoi ça compte** : le trader sait où signaler un problème, et l'équipe dispose du contexte technique pour corriger vite.

### 6.12 Mobile et accessibilité

- Interface responsive mobile-first.
- Sidebar rétractable avec persistance.
- Bottom navigation sur mobile.
- Cibles tactiles de 40 px minimum.
- Composants accessibles : `aria-*`, `role`, focus visible, navigation clavier.
- Support PWA / push.
- Images servies via une route protégée, avec chargement différé lorsque pertinent.

**Pourquoi ça compte** : le trading se fait aussi depuis le téléphone, souvent en déplacement.

---

## 7. Toutes les fonctionnalités côté admin

La console admin est organisée en **5 contextes** et **19 sous-onglets**, complétés par des pages d'outils avancés.

### 7.1 Contexte « Surveiller »

#### Tableau de bord

- KPI : membres actifs, MRR, demandes en attente, signaux publiés.
- Alertes : churn, échecs, éléments à traiter.
- Santé système : Redis, BullMQ, SMTP, stockage.
- Activité récente.
- Personnalisation du dashboard (cartes, ordre).
- Mode focus.
- Suggestions intelligentes.
- Accès rapide aux actions.

#### Analytics

- Nombre de membres.
- Pourcentage de KYC vérifiés.
- Nombre de conversations.
- Sessions actives.
- Courbe des inscriptions sur les N derniers jours.
- Répartition des membres par statut.
- Répartition par plan.
- Vérification KYC.
- Abonnements actifs par plan.
- Graphiques Recharts.
- Filtres de période.

#### Revenus

- Revenu mensuel (MRR).
- Nombre d'abonnés.
- Prix moyen.
- Revenu annuel estimé (ARR).
- Répartition par plan.
- Timeline MRR (nouveaux abonnements, nouveau MRR, MRR cumulé).
- Alerte churn / accès expirés.
- Membres à risque.
- Devise configurable.

#### Appareils

- Répartition ordinateur / mobile / tablette.
- Marque la plus représentée.
- Appareils récents.
- Systèmes d'exploitation, navigateurs.
- Données de fingerprint.
- Optimisation de l'expérience mobile.

### 7.2 Contexte « Décider »

#### Demandes d'accès

- Liste des demandes.
- Filtres par statut.
- Recherche.
- Approbation / rejet avec note.
- Approbation / rejet en lot (batch).
- Streaming SSE pour les actions longues.
- Transaction Prisma pour la cohérence.
- Email automatique au membre lors d'une décision individuelle.
- Changement de plan.
- Révocation.
- Suspension.
- Réactivation.
- Historique.

#### Membres

- Liste paginée.
- Recherche par nom, email, téléphone.
- Filtres : statut actif/inactif, onboarding, plan.
- Détail membre : profil, rôle, plan, échéance, KYC, broker, appareils, sessions.
- Suspendre / réactiver.
- Bannir + blacklister l'email.
- Révoquer les sessions.
- Réinitialiser le statut email.
- Réinitialiser le temps réel.
- Voir les doublons (nom, email, IP).
- Actions batch : suppression, révocation, marquage.
- Export / copie.
- Skeleton loading desktop et mobile.
- Raccourcis clavier.

#### Utilisateurs

- Gestion des rôles.
- Promotion / rétrogradation.
- Vue détaillée.
- Liste des admins.
- Contrôle d'accès granulaire.

#### KYC

- File d'attente des dossiers.
- Filtres par statut.
- Viewer image plein écran.
- Approbation / rejet avec motif.
- Email automatique.
- Note de revue.
- Traçabilité (reviewedBy, reviewedAt).
- Nettoyage automatique après 7 jours.
- Raccourci clavier.

#### Broker

- File d'attente des vérifications.
- Nom du broker, numéro de compte.
- Lecture de la vidéo.
- Approbation / rejet avec motif.
- Email automatique.
- Traçabilité.
- Raccourci clavier.

### 7.3 Contexte « Communiquer »

#### Signaux

- Éditeur en 3 étapes : **Quoi → À qui → Quand**.
- Contenu markdown.
- Jusqu'à 5 images.
- Upload avec validation.
- Sélection des plans destinataires.
- Estimation en direct du nombre de destinataires.
- Répartition par plan.
- Override admin.
- Brouillon auto-sauvegardé (debounce 1 s).
- Reprise du dernier brouillon.
- Planification (date/heure future).
- Publication immédiate ou planifiée.
- Confirmation avant publication.
- Historique des signaux.
- Filtres et recherche.
- Actions : publier, dupliquer, archiver, restaurer, supprimer.
- Détail du signal.
- Métriques de distribution.
- Tableau de bord de diffusion.
- Suivi par canal.
- Tracker de délivrabilité.

#### E-mails

- Suivi des emails envoyés.
- Filtres : tous, en attente, envoyés, en échec, rejetés.
- Statut par notification.
- Erreur détaillée.
- Date.
- Destinataire.
- Statistiques globales.
- Événements Resend : delivered, opened, bounced, complained.
- Données de réputation email calculées par un cron dédié.

#### Notifications

- Rédaction d'une notification système.
- Envoi à tous les utilisateurs.
- Envoi de test à soi-même.
- Historique des notifications.
- Titre + contenu.
- Diffusion in-app + push + email selon préférences.

#### Formation

- Base de connaissances interne pour l'admin.
- Explication des concepts : signaux, diffusion, temps réel, statuts, canaux, sécurité, KYC, audit.
- Fiches pédagogiques avec termes et infobulles.
- Réservée à l'équipe admin.
- Aide à l'onboarding des nouveaux admins.

### 7.4 Contexte « Auditer »

#### Bugs

- Liste des signalements.
- Filtres par statut.
- Sévérité : critique, moyen, mineur.
- Détail : description, étapes, contexte technique.
- Changement de statut : ouvert, en cours, corrigé, fermé.
- Note admin.
- Notification au membre.
- Suivi de la réponse.

#### Modération

- Bannissement par email.
- Motif obligatoire.
- Suppression du compte.
- Révocation des sessions.
- Blocage de la réinscription.
- Liste des bannis.
- Réhabilitation.
- Signalements de messages.
- Traitement des reports.

#### Sécurité

- Sessions récentes.
- Sessions actives.
- IPs uniques.
- Dernière connexion.
- Tentatives de connexion échouées.
- Dernière tentative.
- Révocation de session.
- Actualisation automatique (30 s).
- Vue par utilisateur.

#### Anti-fraude

- Alertes critiques.
- Connexions échouées.
- IPs bloquées.
- Comptes suspendus.
- Appareils bloqués.
- Événements de sécurité à haute sévérité.
- Tentatives de connexion et d'inscription.
- Recherche d'un utilisateur.
- Playbooks d'action.
- Suspension.
- Réactivation.
- Blocage / déblocage d'IP.
- Détection de doublons (nom, email, IP).
- Flags VPN / proxy / Tor / datacenter (IPQS).
- Device fingerprint.
- Niveaux de confiance des appareils.
- Sanctions graduées.

### 7.5 Contexte « Système » (SUPER_ADMIN)

#### Paramètres

- Configuration SMTP : hôte, port, chiffrement, utilisateur, mot de passe, expéditeur.
- Gestion des plans :
  - création ;
  - édition ;
  - suppression ;
  - nom ;
  - description ;
  - prix ;
  - devise ;
  - durée ;
  - features ;
  - ordre d'affichage ;
  - activation / désactivation.
- Configuration de la plateforme.

#### Cron Jobs

- Liste des tâches planifiées.
- Statut.
- Dernière exécution.
- Dernier message.
- Fichier de log.
- Suivi des crons système.
- Aide au diagnostic.

### 7.6 Outils avancés (pages dédiées)

| Outil | Fonction |
|---|---|
| **Centre d'audit** | Recherche, filtres, export, vérification de la chaîne d'intégrité, détail des actions admin |
| **Support** | Tickets membres, conversation, réponse, historique |
| **Messages** | Inbox admin, conversations, pièces jointes, réactions, signalements |
| **Bulk Message** | Sélection d'audience + rédaction + envoi groupé |
| **Coaching** | Vue d'ensemble des journaux, détail des trades, PnL, win rate, setups |
| **Files BullMQ** | Monitoring des files, jobs en attente, échecs, replay |
| **Cache & Services** | Statistiques Redis/cache, purge, état des services |
| **Console développeur** | Réservée SUPER_ADMIN, spécification OpenAPI, Swagger UI |
| **Tracker de délivrabilité** | Entonnoir email/push/in-app, taux de délivrabilité, ouverture, bounce, plainte, santé des workers |
| **Webhooks DLQ** | File des événements en échec, replay, diagnostic |
| **Control Room** | Point d'entrée qui redirige vers le tableau de bord |

### 7.7 Ce que l'admin peut faire de bout en bout

1. **Recruter** : voir les demandes, approuver, envoyer les accès.
2. **Vérifier** : KYC, broker, documents, vidéos.
3. **Segmenter** : plans, audiences, overrides.
4. **Publier** : rédiger, illustrer, planifier, cibler.
5. **Diffuser** : in-app, temps réel, email, push.
6. **Mesurer** : délivrabilité, ouverture, lecture, engagement.
7. **Coacher** : journaux, statistiques, messages.
8. **Modérer** : bugs, reports, bannissements, IP.
9. **Sécuriser** : sessions, appareils, audit, anti-fraude.
10. **Piloter** : MRR, analytics, churn, santé système.
11. **Exploiter** : files, cache, crons, webhooks, OpenAPI.

---

## 8. Le moteur de signaux

### 8.1 Cycle de vie d'un signal

```
BROUILLON
   │  (contenu + audience + images)
   ▼
PLANIFIÉ ──(date future)──▶ PUBLIÉ
   │                          │
   └────────(publication)─────┘
                              ▼
                    DISTRIBUTION
                    ├─ Notification in-app
                    ├─ Événement WebSocket
                    ├─ Email (Resend)
                    └─ Push (Web Push)
                              ▼
                    SUIVI DE LIVRAISON
                    ├─ PENDING
                    ├─ SENT
                    ├─ FAILED
                    └─ BOUNCED
                              ▼
                    LECTURE / FAVORI / ARCHIVE
```

### 8.2 Statuts

| Statut | Signification |
|---|---|
| `DRAFT` | Brouillon, non visible par les membres |
| `PUBLISHED` | Publié, distribué aux audiences |
| `ARCHIVED` | Archivé, masqué de la liste principale |

### 8.3 Audience

Un signal cible une ou plusieurs **plans**. Les destinataires sont :

- les utilisateurs actifs ;
- non supprimés ;
- ayant une `AccessRequest` `APPROVED` pour l'un des plans ciblés ;
- ou bénéficiant d'un `signalsAccessOverride` ;
- moins l'auteur du signal ;
- moins ceux qui ont déjà reçu une notification pour ce signal (idempotence).

### 8.4 Distribution

Le service de distribution :

- traite les destinataires par pages de 500 ;
- crée les notifications par lots de 200 ;
- publie les événements temps réel ;
- crée les livraisons email et push ;
- met les jobs en file avec retry et backoff exponentiel ;
- journalise la progression ;
- évite les doublons ;
- publie un événement admin pour le suivi.

### 8.5 Temps réel

- **Socket.IO** côté serveur.
- **Redis adapter** pour la diffusion multi-instances.
- Canaux par utilisateur : `nba:notif:user:<id>`, `nba:signal:user:<id>`.
- Canal admin : `nba:signal:admin`.
- Le client s'abonne et met à jour l'interface sans rechargement.
- Reconnexion automatique.
- Indicateur de statut de connexion.

### 8.6 Emails

- Templates HTML responsive.
- Logo de marque.
- Contenu du signal.
- Image intégrée en data URI quand disponible.
- Lien vers la plateforme.
- Envoi via Resend.
- Webhooks Resend pour les événements :
  - `email.sent` ;
  - `email.delivered` ;
  - `email.opened` ;
  - `email.bounced` ;
  - `email.complained` ;
  - `email.failed`.
- Mise à jour du statut de livraison.
- Gestion des bounces et plaintes.
- Réputation email.

### 8.7 Push

- Web Push API.
- Clés VAPID.
- Abonnement par navigateur / appareil.
- Notification avec titre, corps, URL, tag.
- Retry et backoff.
- Nettoyage des abonnements invalides.
- Suivi des livraisons.
- Respect des préférences et des heures silencieuses.

### 8.8 Tracker de délivrabilité

Le tracker admin agrège :

- nombre de signaux ;
- destinataires ;
- délivrés ;
- taux de délivrabilité ;
- taux d'ouverture ;
- bounces ;
- taux de bounce ;
- plaintes ;
- emails envoyés ;
- ouverts ;
- in-app lus ;
- push envoyés ;
- push échoués ;
- santé des workers ;
- files en attente ;
- alertes ;
- détail par plan ;
- entonnoir de livraison.

**Pourquoi c'est différenciant** : la plupart des groupes de signaux ne savent pas si le message est arrivé. SignauxX le sait, par canal et par membre.

### 8.9 Versioning et traçabilité

- `SignalVersion` conserve l'historique du contenu.
- `SignalRead` trace la lecture.
- `SignalFavorite` trace les favoris.
- `SignalArchive` trace les archives.
- `SignalAudience` trace les plans ciblés.
- `Notification` et `NotificationDelivery` tracent la diffusion.
- `AuditLog` trace les actions admin.

---

## 9. Sécurité, conformité et anti-fraude

### 9.1 Authentification

- Better Auth.
- Sessions httpOnly, secure, sameSite.
- Cookies de session signés.
- Protection CSRF.
- Origines de confiance (`trustedOrigins`).
- Vérification email.
- OTP à 6 chiffres.
- Réinitialisation de mot de passe par token.
- Rate limiting sur les endpoints sensibles.
- Fenêtre anti-brute-force.
- Journalisation des tentatives de connexion et d'inscription.

### 9.2 Autorisation

- RBAC à 5 rôles :
  - `SUPER_ADMIN` ;
  - `ADMIN` ;
  - `KYC_AGENT` ;
  - `SUPPORT_AGENT` ;
  - `MEMBER`.
- 11 permissions :
  - `users.read`, `users.update`, `users.suspend` ;
  - `subscriptions.manage` ;
  - `kyc.review`, `broker.review` ;
  - `signals.create`, `signals.publish` ;
  - `notifications.send` ;
  - `settings.manage` ;
  - `audit.read`.
- Vérification côté serveur (`requireRole`, `requirePermission`).
- Vérification côté client pour l'affichage.
- Protection des routes dans le middleware.
- Les onglets Système et Console développeur sont réservés au SUPER_ADMIN.

### 9.3 Durcissement HTTP

- CSP dynamique avec **nonce** (pattern officiel Next.js).
- HSTS.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`.
- `Permissions-Policy`.
- TLS via Traefik.
- IP forwarding pour le rate limiting derrière proxy.
- Allowlist d'IP admin optionnelle (`ADMIN_ALLOWED_IPS`).
- Rate limiting admin (120 req/min/IP en mémoire Edge).

### 9.4 Validation des entrées

- Zod `.strict()` sur les schémas.
- Validation des UUID de path params.
- Validation des tailles et types de fichiers.
- **Magic bytes** pour empêcher la falsification de type MIME.
- Contrôle des images, PDF et vidéos.
- Taille maximale par type.
- Noms de fichiers sécurisés.
- Stockage privé.
- Service de fichiers protégé (`/api/files`).

### 9.5 Protection des données

- Documents KYC et broker dans un stockage privé.
- Auto-cleanup après 7 jours.
- Suppression en cascade maîtrisée.
- Hard delete des utilisateurs (réinscription possible avec le même email si non banni).
- Export des données personnelles.
- Suppression de compte.
- Politique de confidentialité, CGU, cookies, avertissement risques.
- Chiffrement en transit (TLS).
- Journalisation des accès.

### 9.6 Audit

- `AuditLog` avec :
  - action ;
  - type de ressource ;
  - identifiant ;
  - détails JSON ;
  - IP ;
  - user-agent ;
  - date ;
  - sévérité ;
  - hash ;
  - hash précédent.
- **Chaîne d'intégrité** : chaque entrée est liée à la précédente.
- Vérification d'intégrité dans le centre d'audit.
- Recherche plein texte.
- Export.
- Récupération / reconstruction.
- Actions sensibles tracées : publication, validation KYC, changement de rôle, suspension, bannissement, etc.

### 9.7 Anti-fraude

- Détection de doublons :
  - nom ;
  - email ;
  - IP.
- Device fingerprint.
- Niveaux de confiance :
  - inconnu ;
  - en attente ;
  - vérifié ;
  - de confiance ;
  - suspect ;
  - bloqué.
- Flags IPQS :
  - VPN ;
  - proxy ;
  - Tor ;
  - datacenter.
- Score de risque.
- Événements de sécurité.
- Tentatives de connexion.
- IPs bloquées.
- Comptes suspendus.
- Appareils bloqués.
- Playbooks de réponse.
- Sanctions graduées.
- Bannissement + blacklist email.
- Révocation de sessions.
- Réactivation contrôlée.

### 9.8 Observabilité

- Sentry pour les erreurs.
- Logs structurés Pino.
- Codes d'erreur métier.
- Healthchecks Docker.
- Endpoint `/api/public/health`.
- Suivi des workers.
- Alertes Discord / email.
- Backups quotidiens.
- Sentry + logs + audit = trois niveaux de preuve.

---

## 10. Architecture technique et exploitation

### 10.1 Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript strict |
| UI | React 19, Tailwind CSS, design system interne |
| Authentification | Better Auth |
| ORM | Prisma 7 |
| Base de données | PostgreSQL (Neon) |
| Cache / files | Redis + BullMQ |
| Temps réel | Socket.IO + Redis adapter |
| Validation | Zod |
| Email | Resend |
| Push | Web Push + VAPID |
| Stockage | S3 / stockage local privé |
| Monitoring | Sentry |
| Conteneurs | Docker multi-stage |
| CI/CD | GitHub Actions + GHCR |
| Reverse proxy | Traefik |
| Infra | VPS1 (app) + VPS2 (worker) + Tailscale |
| Backups | Backblaze B2 |

### 10.2 Topologie

```
                        Internet
                           │
                     ┌─────▼─────┐
                     │  Traefik  │  TLS / routage
                     └─────┬─────┘
                           │
              ┌────────────▼────────────┐
              │   Next.js 16 (VPS1)     │
              │   App + API + Socket.IO │
              └───┬───────┬───────┬─────┘
                  │       │       │
        ┌─────────▼──┐ ┌──▼────┐ ┌▼─────────────┐
        │ PostgreSQL│ │ Redis │ │  Sentry       │
        │  (Neon)   │ │       │ │  Resend       │
        └───────────┘ └───┬───┘ │  Web Push     │
                          │     │  S3 / B2      │
                  ┌───────▼─────┴──────────────┐
                  │  Workers BullMQ (VPS2)     │
                  │  emails / push / signaux   │
                  └────────────────────────────┘
```

### 10.3 Haute disponibilité et résilience

- Séparation app / workers.
- Redis externalisé.
- Retry et backoff sur les jobs.
- Idempotence de la distribution.
- Reprise des jobs échoués.
- DLQ pour les webhooks.
- Healthchecks.
- Redémarrage automatique.
- Déploiement zero-downtime via Traefik.
- Smoke test après déploiement.
- Rollback automatique en cas d'échec.
- Backups quotidiens.
- Alertes de sauvegarde.

### 10.4 Performance

- Index composites sur les requêtes fréquentes.
- Pagination sur les listes.
- Curseur pour les gros volumes.
- Traitement par lots.
- Cache Redis avec TTL.
- Cache client admin.
- Lazy loading des composants lourds.
- Optimisation des images selon les composants (dont Next Image).
- Stream des uploads.
- Validation partielle des fichiers.
- Parallélisation des uploads KYC.
- Parallélisation des sous-files de distribution.

### 10.5 Tests et qualité

- Vitest.
- Tests unitaires et d'intégration.
- 41 fichiers de test.
- Couverture sur les services critiques : distribution, notifications, messagerie, PnL, journal, sécurité, webhooks, policies.
- CI : lint, typecheck, tests, build, Prisma validate.
- Scan de vulnérabilités Docker (Trivy).
- SBOM.
- `pnpm audit` clean au moment de l'audit.
- TypeScript strict, pas de `any` non justifié.
- Architecture modulaire : services, repositories, validators, policies.

---

## 11. Les avantages concrets pour un trader

### 11.1 Ne plus rater un signal

**Le problème** : un signal publié dans un groupe pendant une réunion, un trajet ou une nuit.

**La réponse SignauxX** :

- push navigateur ;
- email ;
- notification in-app ;
- temps réel WebSocket ;
- suivi de livraison ;
- préférences et heures silencieuses.

**Concrètement** : le signal arrive sur le téléphone, le desktop et la boîte mail. Les canaux sont indépendants : un échec email n'empêche pas le push ou l'in-app. L'admin suit la délivrabilité par canal et peut relancer les échecs.

### 11.2 Gagner du temps

**Le problème** : 6 groupes, 3 canaux, 2 fichiers Excel, 1 carnet.

**La réponse SignauxX** :

- un seul flux ;
- recherche ;
- filtres ;
- favoris ;
- archives ;
- lecture ;
- messagerie ;
- journal ;
- support.

**Concrètement** : au lieu de scroller, le trader ouvre « Mes signaux », filtre « Non lus » ou « Forex », et retrouve le signal en quelques secondes.

### 11.3 Recevoir des signaux structurés et exploitables

**Le problème** : un message Telegram avec « BUY EURUSD » et rien d'autre.

**La réponse SignauxX** :

- contenu enrichi ;
- images / graphiques ;
- niveaux SL/TP indiqués dans le contenu ;
- audience claire ;
- date ;
- copie en un clic ;
- historique.

**Concrètement** : le trader voit le contexte, les niveaux et l'image du setup. Il peut copier le contenu pour le coller dans son broker ou son journal.

### 11.4 Mesurer sa performance réelle

**Le problème** : « Je crois que je suis rentable » n'est pas une stratégie.

**La réponse SignauxX** :

- PnL automatique ;
- win rate ;
- drawdown ;
- expectancy ;
- profit factor ;
- R:R moyen ;
- gain moyen / perte moyenne ;
- performance par paire ;
- performance par émotion ;
- courbe de PnL ;
- win/loss par jour.

**Concrètement** : le trader découvre que sa paire fétiche est en réalité sa pire source de pertes, ou que ses trades « revenge » détruisent ses gains.

### 11.5 Corriger sa discipline

**Le problème** : le sur-trading, le revenge trading, l'absence de routine.

**La réponse SignauxX** :

- réflexion quotidienne ;
- note de 1 à 10 ;
- humeur ;
- série de discipline ;
- missions ;
- paliers ;
- rappels ;
- rapport hebdomadaire ;
- coaching admin.

**Concrètement** : chaque soir, le trader note sa journée. Sa série de discipline devient une motivation. L'admin peut voir le journal et intervenir avant que les mauvaises habitudes ne s'installent.

### 11.6 Être dans une communauté vérifiée

**Le problème** : les groupes ouverts sont remplis de faux comptes, de spam et de scams.

**La réponse SignauxX** :

- KYC ;
- vérification broker ;
- email vérifié ;
- device fingerprint ;
- anti-fraude ;
- modération ;
- bannissement ;
- audit.

**Concrètement** : les membres sont identifiés, les comptes suspects sont filtrés, les messages sont modérables. Le trader échange avec une communauté plus sérieuse.

### 11.7 Accéder au bon marché

**Le problème** : un trader Deriv reçoit des signaux Forex, et inversement.

**La réponse SignauxX** :

- plans Forex ;
- plans Deriv ;
- plans combinés ;
- plans Pro ;
- audience par plan ;
- badges de section ;
- filtres Forex / Indices / combinés.

**Concrètement** : chacun reçoit ce pourquoi il a payé, sans bruit inutile.

### 11.8 Garder le contrôle de ses notifications

**Le problème** : trop de notifications tue la notification.

**La réponse SignauxX** :

- préférences par type ;
- heure silencieuse ;
- son personnalisé ;
- volume ;
- push ;
- email ;
- in-app.

**Concrètement** : le trader peut couper les messages mais garder les signaux, ou mettre les push en silencieux la nuit.

### 11.9 Protéger son compte et ses données

**Le problème** : un compte partagé, un appareil perdu, un mot de passe compromis.

**La réponse SignauxX** :

- sessions actives ;
- appareils ;
- révocation ;
- vérification d'appareil ;
- alertes de sécurité ;
- export de données ;
- suppression de compte ;
- nettoyage KYC.

**Concrètement** : en cas de doute, le trader révoque toutes les sessions et vérifie ses appareils en quelques clics.

### 11.10 Être accompagné

**Le problème** : un problème technique ou une question sur un signal reste sans réponse.

**La réponse SignauxX** :

- messagerie directe ;
- support ;
- tickets ;
- signalement de bug ;
- réponses admin ;
- historique.

**Concrètement** : le trader n'est pas seul. Il peut écrire, joindre une capture, et suivre la résolution.

### 11.11 Progresser sur la durée

**Le problème** : les groupes Telegram oublient tout. Impossible de comparer ses mois.

**La réponse SignauxX** :

- historique des signaux ;
- favoris ;
- archives ;
- journal ;
- graphiques ;
- statistiques ;
- sessions ;
- réflexions ;
- coaching.

**Concrètement** : au bout de trois mois, le trader a une vraie base de données personnelle pour progresser.

### 11.12 Réduire la dispersion mentale

**Le problème** : le trader jongle entre Telegram, WhatsApp, email, Excel, le broker et ses notes.

**La réponse SignauxX** :

- un dashboard ;
- un flux ;
- un journal ;
- une messagerie ;
- un abonnement ;
- un support.

**Concrètement** : moins d'applications, moins d'onglets, moins de charge mentale. Plus de temps pour analyser et exécuter.

### 11.13 Une semaine type avec SignauxX

| Moment | Action |
|---|---|
| Lundi matin | Push « Nouveau signal Forex ». Ouverture du détail, lecture, copie. |
| Lundi midi | Exécution chez le broker, puis saisie du trade dans le journal. |
| Lundi soir | Réflexion quotidienne : note 7/10, humeur neutre, note libre. |
| Mardi | Message au coach pour valider un setup. |
| Mercredi | Signal Deriv. Filtre « Deriv » dans l'inbox. |
| Jeudi | Trade perdant. Le journal montre un R:R trop faible. |
| Vendredi | Statistiques : win rate 54 %, profit factor 1,3, drawdown maîtrisé. |
| Samedi | Rapport hebdomadaire par email. |
| Dimanche | Archives et favoris : préparation de la semaine. |

**Ce que ça change** : le trader ne subit plus l'information. Il la reçoit, la filtre, l'exécute, la mesure et la corrige.

---

## 12. SignauxX vs un groupe Telegram / Discord

| Critère | Groupe Telegram / Discord | SignauxX |
|---|---|---|
| **Organisation** | Flux chronologique, bruit | Inbox filtrable, recherche, favoris, archives |
| **Structure du signal** | Message libre | Fiche structurée avec images, audience, contenu enrichi |
| **Preuve de réception** | Aucune | Suivi par canal et par membre |
| **Historique** | Difficile à remonter | Historique complet, versions, archives |
| **Lecture** | Impossible à prouver | SignalRead, accusés, compteurs |
| **Segmentation** | Un groupe = un tout | Audience par plan, Forex/Deriv/Pro |
| **Abonnement** | Gestion manuelle | Plans, demandes, approbation, échéances, emails |
| **KYC / broker** | Aucun | Vérification d'identité et de compte |
| **Anti-fraude** | Aucun | Fingerprint, IPQS, doublons, bannissements |
| **Journal de trading** | Excel ou rien | Journal intégré, PnL, stats, sessions |
| **Coaching** | Aucun | Réflexions, séries, missions, coaching admin |
| **Messagerie** | Groupe public | 1-1 et envoi groupé, pièces jointes, réactions, reports |
| **Support** | Message perdu | Tickets, suivi, historique |
| **Sécurité** | Compte Telegram | Sessions, appareils, révocation, CSP, audit |
| **Admin** | Modération basique | 19 onglets, KYC, revenus, audit, files, tracker |
| **Données** | Aucune | Analytics, MRR, délivrabilité, engagement |
| **Conformité** | Faible | CGU, confidentialité, RGPD, audit, nettoyage |
| **Multi-appareil** | Oui, mais informel | Web/PWA, sessions contrôlées |
| **Marque** | Dépend de la plateforme | Expérience branded, domaine propre |

### Ce que ça change pour le trader

- moins de bruit ;
- plus de structure ;
- plus de preuves ;
- plus de suivi ;
- plus de sécurité ;
- plus de progression.

### Ce que ça change pour l'opérateur

- moins d'opérations manuelles ;
- plus de contrôle ;
- plus de données ;
- plus de revenus récurrents ;
- plus de crédibilité ;
- plus de scalabilité.

---

## 13. Ce que la plateforme apporte à l'opérateur

### 13.1 Monétisation

- 6 plans configurables.
- Prix, devise, durée, features.
- Demandes d'accès et validation.
- Échéances et renouvellements.
- Suivi MRR / ARR.
- Répartition par plan.
- Alertes churn.

### 13.2 Segmentation

- Audience par plan.
- Override manuel.
- Badges de section.
- Ciblage Forex / Deriv / combiné / Pro.
- Estimation du nombre de destinataires avant publication.

### 13.3 Diffusion maîtrisée

- Publication immédiate ou planifiée.
- Brouillon auto-sauvegardé.
- Jusqu'à 5 images.
- Markdown.
- Multi-canal.
- Retry.
- Suivi de délivrabilité.
- Replay des échecs.

### 13.4 Opérations

- KYC et broker dans une file.
- Approbation / rejet en lot.
- Gestion des membres.
- Bannissement.
- Réinitialisation de sessions.
- Support.
- Messages groupés.
- Coaching.

### 13.5 Pilotage

- Dashboard KPI.
- Analytics.
- Revenus.
- Appareils.
- Santé système.
- Files.
- Cache.
- Crons.
- Webhooks.
- OpenAPI.

### 13.6 Confiance et conformité

- KYC.
- Audit chain.
- RBAC.
- CSP.
- Rate limiting.
- Nettoyage RGPD.
- Export / suppression.
- Anti-fraude.
- Backups.

### 13.7 Scalabilité

- Architecture app / workers séparée.
- Redis.
- BullMQ.
- Traitement par lots.
- Pagination.
- Index.
- Cache.
- Docker.
- CI/CD.
- Monitoring.

**En résumé** : la plateforme ne se contente pas d'envoyer des signaux. Elle permet de **vendre, vérifier, segmenter, diffuser, mesurer, supporter, sécuriser et auditer** — sans multiplier les outils.

---

## 14. Limites et points de vigilance

Cette section est volontairement honnête : elle permet de présenter la plateforme sans surpromettre.

### 14.1 Ce que SignauxX n'est pas

- **Ce n'est pas un broker** : la plateforme ne passe aucun ordre.
- **Ce n'est pas un système de copy trading** : elle ne copie pas automatiquement les trades sur un compte.
- **Ce n'est pas une garantie de profit** : les signaux sont informatifs ; le risque reste entier.
- **Ce n'est pas un conseil en investissement personnalisé** : chaque trader reste responsable de ses décisions.
- **Ce n'est pas une application mobile native** : l'expérience est web/PWA, avec push.

### 14.2 Points à vérifier avant une présentation commerciale

- **Paiement en ligne** : dans le code actuel, l'accès est validé manuellement. Si une passerelle de paiement a été ajoutée en production, le préciser.
- **Prix des plans** : les prix sont configurables ; le seed initial est à 0. Utiliser la grille commerciale réelle.
- **Canaux Telegram / WhatsApp** : les enums existent, mais le pipeline de distribution actuel utilise in-app, WebSocket, email et push. Ne pas annoncer Telegram/WhatsApp comme livrés sans vérification.
- **2FA** : des modèles existent, mais l'exposition produit n'est pas garantie. Ne pas l'annoncer sans test.
- **Chiffrement de bout en bout** : la messagerie est protégée en transit et stockée côté serveur ; ce n'est pas un chiffrement E2E de type Signal.
- **Multi-tenant** : la plateforme est mono-organisation dans l'état actuel. Le multi-tenant est un axe de roadmap, pas une fonctionnalité livrée.
- **Chiffres d'usage** : les 81 utilisateurs et les 157k lignes datent de septembre 2026. Actualiser avant toute communication externe.

### 14.3 Risques à présenter clairement

- **Risque de marché** : les signaux peuvent être perdants.
- **Risque de conformité** : la réglementation sur les signaux de trading varie selon les pays.
- **Risque de dépendance** : Resend, Neon, Redis, S3, Sentry sont des services externes.
- **Risque de réputation** : un signal mal formulé ou mal ciblé peut nuire à la confiance.
- **Risque opérationnel** : la validation manuelle des accès peut devenir un goulot d'étranglement à grande échelle.

### 14.4 Ce qui est déjà solide

- Distribution multi-canal avec suivi.
- Inbox structurée.
- Journal de trading complet.
- KYC / broker.
- RBAC / audit.
- Anti-fraude.
- Console admin.
- Sécurité HTTP.
- CI/CD.
- Monitoring.

---

## 15. Le pitch en 60 secondes

> **SignauxX, c'est la plateforme qui transforme un groupe de signaux en véritable produit.**
>
> Aujourd'hui, la plupart des traders reçoivent leurs signaux dans des groupes Telegram : ça défile, ça se perd, personne ne sait si le message est arrivé, et personne ne mesure vraiment ce qu'il en fait.
>
> SignauxX centralise tout : un flux de signaux structuré, filtrable et traçable ; une diffusion en temps réel, par email et par push ; un journal de trading qui calcule automatiquement le PnL, le win rate, le drawdown, l'expectancy et le profit factor ; des réflexions quotidiennes, des séries de discipline et un coaching ; une messagerie intégrée ; et une console admin complète pour gérer les membres, le KYC, les plans, les signaux, la sécurité et le support.
>
> Concrètement, le trader ne rate plus un signal, il le comprend, il l'exécute, il le mesure et il progresse. L'opérateur, lui, pilote toute son activité depuis un seul back-office.
>
> **SignauxX : recevoir, comprendre, exécuter, mesurer.**

---

## 16. Annexes

### 16.1 Carte des onglets admin

| Contexte | Onglet | Rôle principal |
|---|---|---|
| Surveiller | Tableau de bord | KPI, alertes, santé système |
| Surveiller | Analytics | Inscriptions, KYC, plans, sessions |
| Surveiller | Revenus | MRR, ARR, churn, répartition |
| Surveiller | Appareils | Mobile/desktop, navigateurs, marques |
| Décider | Demandes | Approbation / rejet des accès |
| Décider | Membres | Recherche, filtres, actions, doublons |
| Décider | Utilisateurs | Rôles et permissions |
| Décider | KYC | Vérification des documents |
| Décider | Broker | Vérification des comptes |
| Communiquer | Signaux | Éditeur, audience, planification, diffusion |
| Communiquer | E-mails | Suivi des livraisons |
| Communiquer | Notifications | Annonces système |
| Communiquer | Formation | Base de connaissances admin |
| Auditer | Bugs | Signalements et suivi |
| Auditer | Modération | Bannissements et reports |
| Auditer | Sécurité | Sessions et tentatives |
| Auditer | Anti-Fraude | Alertes, IP, playbooks |
| Système | Paramètres | SMTP, plans |
| Système | Cron Jobs | Tâches planifiées |

### 16.2 Routes API — vue d'ensemble

| Domaine | Nombre | Exemples |
|---|---|---|
| Admin | 86 | `admin/signals`, `admin/kyc`, `admin/members`, `admin/revenue`, `admin/security` |
| Dashboard | 40 | `dashboard/signals`, `dashboard/journal`, `dashboard/messages`, `dashboard/subscription` |
| Onboarding / auth / public / docs / files / push / sessions / webhooks | 23 | `onboarding/kyc`, `auth/sign-in`, `public/plans`, `docs`, `files`, `push`, `sessions`, `webhooks/resend` |
| **Total** | **149** | |

### 16.3 Points d'entrée dans le code

#### Côté membre

| Fonctionnalité | Fichier |
|---|---|
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| Inbox signaux | `src/app/(dashboard)/dashboard/signals/components/signals-view.tsx` |
| Détail signal | `src/app/(dashboard)/dashboard/signals/[id]/page.tsx` |
| Journal | `src/app/(dashboard)/dashboard/journal/page.tsx` |
| Statistiques | `src/app/(dashboard)/dashboard/journal/components/stats-dashboard.tsx` |
| Formulaire trade | `src/app/(dashboard)/dashboard/journal/components/trade-form.tsx` |
| Messagerie | `src/app/(dashboard)/dashboard/messages/` |
| Notifications | `src/app/(dashboard)/dashboard/notifications/page.tsx` |
| Abonnement | `src/app/(dashboard)/dashboard/subscription/page.tsx` |
| Profil | `src/app/(dashboard)/dashboard/profile/page.tsx` |
| Vérification | `src/app/(dashboard)/dashboard/verification/page.tsx` |
| Appareils | `src/app/(dashboard)/dashboard/devices/page.tsx` |
| Support | `src/app/(dashboard)/dashboard/support/page.tsx` |
| Onboarding | `src/app/(onboarding)/onboarding/` |

#### Côté admin

| Fonctionnalité | Fichier |
|---|---|
| Console et onglets | `src/app/(admin)/admin/page.tsx` |
| Définition des contextes | `src/app/(admin)/admin/admin-context.ts` |
| Dashboard | `src/app/(admin)/admin/features/DashboardTab.tsx` |
| Analytics | `src/app/(admin)/admin/features/AnalyticsTab.tsx` |
| Revenus | `src/app/(admin)/admin/features/RevenueTab.tsx` |
| Demandes | `src/app/(admin)/admin/features/RequestsTab.tsx` |
| Membres | `src/app/(admin)/admin/features/MembresTab.tsx` |
| KYC | `src/app/(admin)/admin/features/KycTab.tsx` |
| Broker | `src/app/(admin)/admin/features/BrokerTab.tsx` |
| Signaux | `src/app/(admin)/admin/features/SignalsTab.tsx` |
| Éditeur de signaux | `src/app/(admin)/admin/components/signal-editor.tsx` |
| Sécurité | `src/app/(admin)/admin/features/SecurityTab.tsx` |
| Anti-fraude | `src/app/(admin)/admin/features/FraudTab.tsx` |
| Audit | `src/app/(admin)/admin/audit/page.tsx` |
| Support | `src/app/(admin)/admin/support/page.tsx` |
| Messages | `src/app/(admin)/admin/messages/page.tsx` |
| Coaching | `src/app/(admin)/admin/coaching/page.tsx` |
| Tracker | `src/app/(admin)/admin/tracker/page.tsx` |
| Files BullMQ | `src/app/(admin)/admin/queues/page.tsx` |
| Cache | `src/app/(admin)/admin/cache/page.tsx` |
| Console développeur | `src/app/(admin)/admin/developer/page.tsx` |

#### Services partagés

| Service | Fichier |
|---|---|
| Distribution des signaux | `src/lib/services/signal-distribution.ts` |
| Notifications | `src/lib/services/notifications.ts` |
| Messagerie | `src/lib/services/messaging.ts` |
| PnL | `src/lib/services/pnl.ts` |
| Discipline | `src/lib/services/journal-discipline.ts` |
| Psychologie | `src/lib/services/journal-psychology.ts` |
| Audit | `src/lib/services/audit.ts` |
| Onboarding | `src/lib/services/onboarding.ts` |
| Accès | `src/lib/services/access.ts` |
| Push | `src/lib/services/push.ts` |
| Webhooks email | `src/lib/services/email-webhooks.ts` |
| Modération | `src/lib/services/moderation.ts` |
| Anti-fraude | `src/lib/services/ipqs.ts` |
| Appareils | `src/lib/services/device.ts` |
| Suppression utilisateur | `src/lib/services/user-deletion.ts` |
| Schéma de données | `prisma/schema.prisma` |

### 16.4 Glossaire

| Terme | Définition |
|---|---|
| **Signal** | Recommandation ou analyse de trading envoyée aux membres d'un ou plusieurs plans |
| **Audience** | Ensemble des plans ciblés par un signal |
| **Plan** | Offre d'abonnement (Forex, Deriv, combiné, Pro) |
| **AccessRequest** | Demande d'accès à un plan, validée par un admin |
| **KYC** | Vérification d'identité |
| **Broker** | Vérification du compte de trading |
| **Notification** | Message in-app créé pour un membre |
| **NotificationDelivery** | Suivi d'envoi d'une notification par canal (email, push) |
| **SignalRead** | Trace de lecture d'un signal |
| **SignalFavorite** | Favori d'un signal |
| **SignalArchive** | Archive d'un signal |
| **PnL** | Profit and Loss, gain ou perte d'un trade |
| **Win rate** | Pourcentage de trades gagnants |
| **Drawdown** | Baisse maximale depuis un sommet |
| **Expectancy** | Gain moyen attendu par trade |
| **Profit factor** | Gains bruts / pertes brutes |
| **R:R** | Ratio risque / récompense |
| **Streak** | Série de victoires, de défaites ou de discipline |
| **Session** | Période de trading démarrée et arrêtée par le membre |
| **Réflexion** | Note quotidienne sur la journée de trading |
| **RBAC** | Contrôle d'accès basé sur les rôles |
| **AuditLog** | Journal des actions sensibles avec chaîne d'intégrité |
| **DLQ** | Dead Letter Queue, file des événements en échec |
| **BullMQ** | Bibliothèque de files de jobs asynchrones |
| **Socket.IO** | Bibliothèque de communication temps réel |
| **Resend** | Service d'envoi d'emails transactionnels |
| **Web Push** | Notifications push navigateur |
| **PWA** | Progressive Web App |

### 16.5 Plan de présentation en 12 slides

| Slide | Titre | Message clé |
|---|---|---|
| 1 | **SignauxX** | Recevoir, comprendre, exécuter, mesurer |
| 2 | Le problème | Les groupes Telegram ne sont pas un produit |
| 3 | La solution | 4 piliers : centraliser, structurer, prouver, accompagner |
| 4 | Le parcours membre | Inscription → KYC → broker → plan → signaux → journal |
| 5 | Les signaux | Inbox filtrable, temps réel, multi-canal, traçabilité |
| 6 | Le journal | PnL, win rate, drawdown, expectancy, profit factor, R:R |
| 7 | Le coaching | Réflexions, discipline, missions, accompagnement |
| 8 | La confiance | KYC, anti-fraude, audit, RGPD, sécurité |
| 9 | La console admin | 19 sous-onglets, KYC, signaux, revenus, support, audit |
| 10 | Les avantages trader | 12 bénéfices concrets, semaine type |
| 11 | Le comparatif | SignauxX vs Telegram/Discord + limites honnêtes |
| 12 | Conclusion | « SignauxX : recevoir, comprendre, exécuter, mesurer. » |

### 16.6 Sources

- Code source : `src/`.
- Schéma de données : `prisma/schema.prisma`.
- Routes API : `src/app/api/`.
- Documentation produit : `DOCUMENTATION.md`, `dossier/`, `docs/`.
- Spécifications : `docs/01-product/`.
- Dossier de présentation : `dossier/01_PRESENTATION/`.

---

> **Note finale** : ce document décrit la plateforme telle qu'elle existe dans le code et dans le dossier produit. Avant une présentation externe, vérifier les prix, les canaux réellement activés en production et les chiffres d'usage à jour.
