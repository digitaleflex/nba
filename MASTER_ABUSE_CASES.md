# MASTER ABUSE CASES

> Catalogue des cas d'abus et de mauvaise utilisation de la plateforme NBA.
> Stack: Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO 4.8, BullMQ, MinIO/S3, imgproxy, Traefik, Cloudflare, Docker, PM2

---

## Table des Matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Account abuse](#2-account-abuse)
3. [Authentication abuse](#3-authentication-abuse)
4. [API abuse](#4-api-abuse)
5. [Content abuse](#5-content-abuse)
6. [Financial abuse](#6-financial-abuse)
7. [Platform abuse](#7-platform-abuse)
8. [Data abuse](#8-data-abuse)
9. [Communication abuse](#9-communication-abuse)
10. [Techniques de detection](#10-techniques-de-detection)
11. [Reponses et sanctions](#11-reponses-et-sanctions)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Ce document catalogue les cas d'abus identifies sur la plateforme NBA, les techniques de detection associees et les reponses automatisees ou manuelles.

### 1.2 Categories d'abus

| Categorie | Description | Risque |
|-----------|------------|--------|
| Account | Creation multiple, revente, automatisation | Eleve |
| Authentication | Brute force, credential stuffing, session hijack | Critique |
| API | Rate limit bypass, scraping, DDoS | Eleve |
| Content | Spam, contenu illegal, manipulation signaux | Moyen |
| Financial | Fraude paiement, blanchiment, abus parrainage | Critique |
| Platform | Contournement restrictions, exploitation failles | Critique |
| Data | Exfiltration, telechargement massif, revente | Critique |
| Communication | Phishing, usurpation, spam messagerie | Eleve |

---

## 2. Account abuse

### 2.1 Creation multiple de comptes

| Aspect | Detail |
|--------|--------|
| **Description** | Creation de plusieurs comptes pour contourner les limites, les restrictions ou pour du multi-account trading |
| **Detection** | Meme IP/device fingerprint, email patterns (tempmail), heure de creation rapprochee, patterns de comportement identiques |
| **Indicateurs** | > 3 comptes par IP/device en 24h, emails sur domaines jetables, creation a la seconde pres, profils identiques |
| **Severite** | HAUTE |
| **Reponse** | Fusion des comptes, blocage des comptes secondaires, avertissement |
| **Prevention** | Rate limit creation compte, verification email obligatoire, device fingerprint, KYC obligatoire avant trading |

### 2.2 Revente de comptes

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisateur vend son acces a un tiers, changement brutal de comportement geographique |
| **Detection** | Impossible travel, changement IP/pays brutal, modification profil apres creation |
| **Indicateurs** | IP et pays completement differents, sessions simultanees de pays differents, modification email/MDP |
| **Severite** | CRITIQUE |
| **Reponse** | Suspension compte, revoke sessions, alerte equipe fraude |
| **Prevention** | Device trust, verification periodique, 2FA obligatoire |

### 2.3 Comptes dormants pirates

| Aspect | Detail |
|--------|--------|
| **Description** | Compte inactif depuis longtemps repris par un attaquant |
| **Detection** | Login depuis nouvel appareil/IP apres > 90 jours inactivite |
| **Indicateurs** | Derniere connexion > 90 jours, nouveau device/pays, tentative de modification email |
| **Severite** | HAUTE |
| **Reponse** | Challenge 2FA obligatoire, notification email, verification identite |
| **Prevention** | Desactivation comptes > 1 an inactif, alertes reprise compte |

### 2.4 Automation et bots

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisation de scripts/bots pour automatiser des actions (trading, creation compte, scraping) |
| **Detection** | Comportement non-humain (rapidite, horaires, patterns), user-agent, taux de clics |
| **Indicateurs** | Actions en millisecondes, 24/7 actif, user-agent headless/curl, absence souris/scroll, sequences identiques |
| **Severite** | HAUTE |
| **Reponse** | Blocage compte + IP, CAPTCHA challenge, rate limit strict |
| **Prevention** | Behavior analysis, CAPTCHA sur actions critiques, rate limit, detection automation |

---

## 3. Authentication abuse

### 3.1 Credential stuffing

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisation de listes de mots de passe fuites pour tenter de se connecter |
| **Detection** | Tentatives massives depuis IPs differentes, emails fuites connus |
| **Indicateurs** | Meme mot de passe tente sur plusieurs comptes, IPs residientielles, emails de base de donnees fuites, tentatives espaces dans le temps |
| **Severite** | CRITIQUE |
| **Reponse** | Blocage IP, CAPTCHA, notification utilisateurs cibles, force reset MDP |
| **Prevention** | Rate limit, detection fuite via HaveIBeenPwned, 2FA obligatoire, MDP complexes |

### 3.2 Session hijacking

| Aspect | Detail |
|--------|--------|
| **Description** | Vol de token de session (XSS, sniffing, malware) |
| **Detection** | Impossible travel, IP/user-agent mismatch, utilisation simultanee |
| **Indicateurs** | Changement IP brutal, user-agent different, deux sessions actives IP distantes |
| **Severite** | CRITIQUE |
| **Reponse** | Revoke session immediate, alerte utilisateur, force 2FA |
| **Prevention** | HttpOnly cookies, SameSite Strict, rotation tokens, device binding |

### 3.3 Brute force distribue

| Aspect | Detail |
|--------|--------|
| **Description** | Attaque brute force repartie sur plusieurs IPs (botnet) pour eviter rate limit |
| **Detection** | LOGIN_FAILED sur meme compte depuis IPs differentes, pattern temporel |
| **Indicateurs** | Meme compte, IPs differentes, espacage regulier, emails tries alphabetiquement |
| **Severite** | CRITIQUE |
| **Reponse** | CAPTCHA global, blocage temporaire compte, challenge 2FA |
| **Prevention** | Rate limit global, detection pattern distribue, 2FA, CAPTCHA |

### 3.4 OAuth token reuse

| Aspect | Detail |
|--------|--------|
| **Description** | Reutilisation d'un token OAuth expire ou revoque |
| **Detection** | Token expire, signature invalide, scope modifie |
| **Indicateurs** | Token avec date expiree, signature ne correspond pas, scope non autorise |
| **Severite** | MOYENNE |
| **Reponse** | Rejet + log, rotation cles OAuth |
| **Prevention** | Validation token stricte, short-lived tokens, PKCE |

---

## 4. API abuse

### 4.1 Web scraping

| Aspect | Detail |
|--------|--------|
| **Description** | Extraction automatisee de donnees via les endpoints API |
| **Detection** | Volume anormal, patterns, user-agent, vitesse requetes, heures non-ouvrees |
| **Indicateurs** | > 1000 req/h depuis meme IP, pagination completee rapidement, user-agent non-standard, absence referer |
| **Severite** | HAUTE |
| **Reponse** | Rate limit strict, blocage IP, rotation endpoints, captcha |
| **Prevention** | Rate limit, API keys, monitoring volume, detection patterns |

### 4.2 API DDoS

| Aspect | Detail |
|--------|--------|
| **Description** | Attaque par deni de service distribue sur les endpoints API |
| **Detection** | Volume anormal, latence, erreurs 429/503 |
| **Indicateurs** | Trafic multiplicatif, IPs distribuees, endpoint specifique cible |
| **Severite** | CRITIQUE |
| **Reponse** | Cloudflare Under Attack Mode, blocage IP massif, scaling auto |
| **Prevention** | Rate limit, Cloudflare DDoS protection, auto-scaling, WAF |

### 4.3 GraphQL abuse

| Aspect | Detail |
|--------|--------|
| **Description** | Requetes GraphQL profondes/nichées pour surcharger le serveur |
| **Detection** | Query depth > 5, aliases multiples, requetes couteuses |
| **Indicateurs** | Depth > 5, > 10 aliases, requetes sans pagination, fields excessifs |
| **Severite** | HAUTE |
| **Reponse** | Rejet requete, blocage temporaire IP |
| **Prevention** | Query depth limit, query cost analysis, pagination forcee, rate limit |

### 4.4 API key leak

| Aspect | Detail |
|--------|--------|
| **Description** | Cle API exposee (commit, log, referer, URL) et utilisee par un tiers |
| **Detection** | IP non autorisee utilise cle, activite anormale |
| **Indicateurs** | IP jamais vue, volume inhabituel, acces ressources non utilisees |
| **Severite** | CRITIQUE |
| **Reponse** | Revoke immediate cle, rotation, analyse logs utilisation |
| **Prevention** | Scanning automatise fuite, detection anormalie, restrictions IP, permissions limitees |

---

## 5. Content abuse

### 5.1 Spam et contenu inapproprie

| Aspect | Detail |
|--------|--------|
| **Description** | Envoi de messages non sollicites, contenu illegal ou inapproprie |
| **Detection** | Moderation automatique (filtres mots-cles), signalement utilisateurs |
| **Indicateurs** | Lien court, contenu duplique, langage offensant, URL blacklistees |
| **Severite** | MOYENNE |
| **Reponse** | Suppression contenu, avertissement, suspension si recidive |
| **Prevention** | Moderation pre-publication, blacklist mots, limite envoi, signalement |

### 5.2 Manipulation de signaux

| Aspect | Detail |
|--------|--------|
| **Description** | Publication de signaux frauduleux pour manipuler le marche ou les utilisateurs |
| **Detection** | Patterns anormaux, signaux contradictoires, volume suspect |
| **Indicateurs** | Signal suivi de l'inverse, volume inhabituel, signaux identiques copies |
| **Severite** | CRITIQUE |
| **Reponse** | Suspension immediat, revoke signaux, alerte utilisateurs, flag compte |
| **Prevention** | Validation contenu, limites publication, analyse comportementale |

---

## 6. Financial abuse

### 6.1 Fraude de paiement

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisation de moyens de paiement voles ou frauduleux |
| **Detection** | Verification paiement, 3D Secure, anomalie montant/frequence |
| **Indicateurs** | Plusieurs cartes echoouees, montant inhabituel, pays different |
| **Severite** | CRITIQUE |
| **Reponse** | Annulation abonnement, blocage compte, signalement legal |
| **Prevention** | 3D Secure, verification identite, limite tentative, scoring fraude |

### 6.2 Abus de parrainage

| Aspect | Detail |
|--------|--------|
| **Description** | Creation de faux comptes pour beneficier du programme de parrainage |
| **Detection** | IP commune, device commun, emails jetables, comptes sans activite |
| **Indicateurs** | Meme IP pour parrain + filleuls, comptes sans KYC, creation en rafale |
| **Severite** | HAUTE |
| **Reponse** | Annulation gains parrainage, blocage comptes fraudeurs |
| **Prevention** | KYC obligatoire, activation compte requise, limite filleuls, delai validation |

### 6.3 Blanchiment d'argent

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisation de la plateforme pour blanchir des fonds |
| **Detection** | Transactions anormales, montants ronds, frequence elevee, allee-retour |
| **Indicateurs** | Depot/retrait sans trading, montants juste sous seuil declaration, comptes multiples memes fonds |
| **Severite** | CRITIQUE |
| **Reponse** | Gel compte, signalement Tracfin, suspension immediat |
| **Prevention** | KYC/AML verification, limite montant, monitoring transactions, scoring AML |

---

## 7. Platform abuse

### 7.1 Contournement des limites plan

| Aspect | Detail |
|--------|--------|
| **Description** | Contourner les limitations imposees par le plan d'abonnement |
| **Detection** | Sessions simultanees depassant le quota, devices multiples |
| **Indicateurs** | > maxSessions, > maxDevices, connexions depuis IPs differentes simultanees |
| **Severite** | MOYENNE |
| **Reponse** | Revoke sessions excessives, downgrade plan, notification |
| **Prevention** | Session manager enforcement, rate limit, monitoring quotas |

### 7.2 Account sharing

| Aspect | Detail |
|--------|--------|
| **Description** | Partage de compte entre plusieurs utilisateurs |
| **Detection** | Sessions simultanees depuis IPs/pays differents, device switching |
| **Indicateurs** | 2+ sessions actives IP/pays differents, rotation appareils, heures activite deplaces |
| **Severite** | MOYENNE (HAUTE si plan premium) |
| **Reponse** | Avertissement, limitation sessions, upgrade plan force |
| **Prevention** | Session limit, device trust, detection simultanee, alerte partage |

### 7.3 API reverse engineering

| Aspect | Detail |
|--------|--------|
| **Description** | Analyse du code client pour comprendre les API et les exploiter |
| **Detection** | Appels non documentes, parametres invalides, modification payload |
| **Indicateurs** | Endpoints non documentes appeles, parametres non standard, headers modifies |
| **Severite** | HAUTE |
| **Reponse** | Blocage IP, rotation API, obfuscation |
| **Prevention** | API minification, validation stricte, rate limit, monitoring |

---

## 8. Data abuse

### 8.1 Data exfiltration

| Aspect | Detail |
|--------|--------|
| **Description** | Telechargement massif de donnees via l'API ou l'interface |
| **Detection** | DATA_EXPORT anormal, volume sortant, pagination complete |
| **Indicateurs** | Export de toutes les donnees, pagination consecutive, appel API sans UI |
| **Severite** | CRITIQUE |
| **Reponse** | Blocage export, revoke session, suspension compte, alerte CSIRT |
| **Prevention** | Rate limit export, quota utilisateur, alerte volume, logs audit |

### 8.2 Violation RGPD

| Aspect | Detail |
|--------|--------|
| **Description** | Acces non autorise aux donnees personnelles d'autres utilisateurs |
| **Detection** | Requete avec userId different du session userId, pattern IDOR |
| **Indicateurs** | Parametre userId editable, reponse contient donnees autres users, pattern incrementiel |
| **Severite** | CRITIQUE |
| **Reponse** | Blocage requete, audit logs, analyse impact, notification CNIL si fuite |
| **Prevention** | Authorization checks, RLS PostgreSQL, logs audit, tests IDOR |

---

## 9. Communication abuse

### 9.1 Phishing via messagerie

| Aspect | Detail |
|--------|--------|
| **Description** | Utilisation de la messagerie interne pour envoyer des liens de phishing |
| **Detection** | Liens externes, domaines suspects, contenu urgent |
| **Indicateurs** | Lien vers site externe, demande information sensible, message urgent |
| **Severite** | CRITIQUE |
| **Reponse** | Suppression message, suspension expediteur, alerte destinataires |
| **Prevention** | Filtre URL, blocage domaines malveillants, education utilisateurs |

### 9.2 Usurpation compte contact

| Aspect | Detail |
|--------|--------|
| **Description** | Usurpation d'un contact pour obtenir des informations ou fonds |
| **Detection** | Changement email soudain, message hors-personnalite |
| **Indicateurs** | Email modifie recemment, message inhabituel, demande de virement |
| **Severite** | CRITIQUE |
| **Reponse** | Verification identite, alerte contact original, blocage |
| **Prevention** | Verification email changement, 2FA transactions, alertes securite |

---

## 10. Techniques de detection

| Technique | Outil | Cas d'usage |
|-----------|-------|-------------|
| Rate limiting | Redis + middleware | Brute force, scraping, DDoS |
| Device fingerprint | DeviceFingerprintService | Creation multiple, account sharing |
| IP reputation | IpReputationService | VPN, Tor, proxy detection |
| Impossible travel | ImpossibleTravelDetector | Session hijack, compte revendu |
| Risk scoring | SyncRiskEngine + AsyncRiskEngine | Evaluation continue risque |
| Behavior analysis | Pattern matching | Bots, automation, fraude |
| Anomaly detection | Statistical analysis (Redis) | Data exfiltration, volume anormal |
| WAF rules | Cloudflare | Injection, XSS, SSRF |
| CSP reports | Browser reporting | XSS, data exfiltration |
| Audit logs | AuditLog + integrity chain | Forensics, conformite |

---

## 11. Reponses et sanctions

| Niveau | Action | Delai | Communication |
|--------|--------|-------|---------------|
| **Avertissement** | Notification utilisateur, log | Immediate | Email automatique |
| **Restriction** | Rate limit renforce, features limitees | 24h | Email + notification app |
| **Suspension temporaire** | Compte desactive, sessions revokees | 48h-7j | Email + appel si premium |
| **Suspension permanente** | Compte supprime, donnees retirees | Permanent | Email + confirmation legale |
| **Signalement legal** | Signalement autorites (Tracfin, CNIL, ANSSI) | Selon obligation | Legal + DPO |

### 11.1 Matrice des sanctions

| Abus | 1ere infraction | 2eme infraction | 3eme infraction |
|------|----------------|-----------------|-----------------|
| Spam | Avertissement | Restriction 7j | Suspension permanente |
| Multi-comptes | Fusion comptes | Suspension 30j | Suspension permanente |
| Account sharing | Avertissement | Restriction downgrade | Suspension compte |
| Brute force | Blocage IP 1h | Blocage IP 24h | Blacklist permanent |
| Scraping | Rate limit strict | Blocage IP 7j | Blacklist permanent |
| Fraude paiement | Suspension permanente + legal | N/A | N/A |
| Phishing | Suspension permanente + legal | N/A | N/A |
| Data exfiltration | Suspension permanente + legal | N/A | N/A |

### 11.2 Processus d'appel

1. L'utilisateur recoit notification avec motif et duree
2. L'utilisateur peut contester via support@nba.com (48h)
3. Revue par equipe securite sous 24h
4. Decision finale notifiee par email
5. Possibilite de recours legal si insatisfait
