# MASTER INCIDENT RESPONSE

> Plan de reponse aux incidents de securite pour la plateforme NBA.
> Stack: Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO 4.8, BullMQ, MinIO/S3, imgproxy, Traefik, Cloudflare, Docker, PM2

---

## Table des Matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Classification des incidents](#2-classification-des-incidents)
3. [Equipe de reponse (CSIRT)](#3-equipe-de-reponse-csirt)
4. [Phases de reponse](#4-phases-de-reponse)
5. [Playbooks par type d'incident](#5-playbooks-par-type-dincident)
6. [Outils de reponse](#6-outils-de-reponse)
7. [Communication](#7-communication)
8. [Post-mortem et retours d'experience](#8-post-mortem-et-retours-dexperience)
9. [Exercices et tests](#9-exercices-et-tests)
10. [Annexes](#10-annexes)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Ce document definit le processus de reponse aux incidents de securite pour la plateforme NBA. Il couvre la detection, l'analyse, le confinement, l'eradication, la restauration et le retour d'experience pour tous les types d'incidents.

### 1.2 Principes directeurs

1. **Securite avant tout** — la protection des donnees utilisateurs est prioritaire
2. **Vitesse de reaction** — time-to-respond < 5min pour les incidents critiques
3. **Chaine de retention** — chaque action est documentee et auditable
4. **Communication** — transparence avec les parties prenantes
5. **Amelioration continue** — chaque incident genere des actions correctives

### 1.3 Definitions

| Terme | Definition |
|-------|-----------|
| IR | Incident Response |
| CSIRT | Computer Security Incident Response Team |
| SLA | Service Level Agreement (temps de reponse) |
| MTTR | Mean Time To Respond |
| MTTC | Mean Time To Contain |
| IOC | Indicator of Compromise |
| TTP | Tactics, Techniques, and Procedures |
| P0 | Incident critique (priorite 0) |
| P1 | Incident haut (priorite 1) |
| P2 | Incident moyen (priorite 2) |
| P3 | Incident faible (priorite 3) |

---

## 2. Classification des incidents

| Niveau | Impact | Temps reponse | Temps confinement | Exemples |
|--------|--------|---------------|-------------------|----------|
| **P0 Critique** | Donnees utilisateurs exposees, indisponibilite totale | < 5min | < 30min | BDD compromise, fuite masse donnees, ransomware, injection SQL reussie |
| **P1 Haut** | Fonctionnalite critique impactee, acces non autorise limite | < 15min | < 2h | Intrusion reussie sur un compte, defacement, DDoS significatif |
| **P2 Moyen** | Incident isole, tentative d'intrusion detectee | < 1h | < 24h | Brute force detecte, scan de vulnerabilite, alertes IDS |
| **P3 Faible** | Anomalie de securite sans impact immediat | < 24h | < 72h | Phishing signale, configuration non conforme, alerte basse severite |

---

## 3. Equipe de reponse (CSIRT)

### 3.1 Roles et responsabilites

| Role | Personne | Responsabilites | Backup |
|------|----------|-----------------|--------|
| Incident Commander | Lead SRE | Coordination, decisions, communication | SRE senior |
| Security Analyst | SecOps | Analyse forensique, recherche IOC | SecDev |
| Infrastructure Lead | SRE | Containment, restauration infra | DevOps |
| Communications Lead | Lead Dev | Communication interne/externe, legal | CTO |
| Developer | Dev senior | Correction code, deploiement correctif | Dev lead |
| Legal | Legal/DPO | Obligations legales, notification CNIL | CEO |

### 3.2 Escalade

| Niveau | Declencheur | Contacte | Delai |
|--------|------------|----------|-------|
| L1 | Incident P2/P3 | Security Analyst | Immediate |
| L2 | Incident P1 | Incident Commander | < 5min |
| L3 | Incident P0 | CTO, CEO | < 5min |
| L4 | Fuite donnees massives | Legal/DPO, CNIL | < 24h (obligation legale) |

---

## 4. Phases de reponse

### 4.1 Preparation

- Runbooks documentes et accessibles (ce document)
- Outils de reponse prets (bastion, logs, backups)
- Exercices reguliers (tabletop exercises tous les mois)
- Canaux de communication definis (Slack #security-incident, phone tree)

### 4.2 Detection et analyse

**Sources de detection:**
- Security Event Bus (evenements securite)
- Monitoring Datadog/Grafana
- Alertes WAF Cloudflare
- OWASP ZAP scans automatises
- Logs d'audit (AuditLog, LoginAttempt, SecurityEvent)
- Rapports utilisateurs
- Scanning de vulnerabilite hebdomadaire

**Analyse initiale (Triage):**
1. Verifier la severite de l'alerte
2. Collecter les logs pertinents (5 Why)
3. Determiner le type d'incident
4. Escalader si necessaire
5. Ouvrir un ticket incident

### 4.3 Containment

**Actions immediates:**
1. Isoler la ressource compromise (revoke sessions, disable account)
2. Bloquer IP/Tokens compromis
3. Activer le mode maintenance si necessaire
4. Capturer les donnees forensiques (logs, snapshots, memory dump)
5. Notifier l'equipe

### 4.4 Eradication

1. Identifier la cause racine
2. Supprimer l'acces de l'attaquant
3. Pivoter les secrets compromis
4. Corriger la vulnerabilite
5. Verifier l'absence de persistence

### 4.5 Restauration

1. Restaurer depuis les backups (valides, non compromis)
2. Verifier l'integrite des donnees
3. Re-autoriser les acces legitimes
4. Surveiller etroitement pendant 72h
5. Annoncer le retour a la normale

### 4.6 Post-mortem

1. Chronologie complete de l'incident
2. Analyse des causes racines (5 Why)
3. Actions correctives et preventives
4. Mise a jour des runbooks
5. Rapport de securite

---

## 5. Playbooks par type d'incident

### 5.1 Intrusion compte utilisateur

**Detection:** LoginAttempt anormaux, SecurityEvent suspendu, signalement utilisateur

**Actions:**
1. [CONTAIN] Revoke toutes les sessions du compte (`sessionManager.revokeAllSessions`)
2. [CONTAIN] Desactiver le compte (`user.isActive = false`)
3. [CONTAIN] Changer les cles API associees
4. [ANALYSE] Identifier la methode d'intrusion (MDP faible, phishing, fuite)
5. [ANALYSE] Verifier les actions effectuees pendant la compromission
6. [ERADICATE] Forcer le reset du mot de passe
7. [ERADICATE] Activer 2FA obligatoire
8. [RESTORE] Reactiver le compte apres confirmation utilisateur
9. [NOTIFY] Envoyer email d'alerte a l'utilisateur

**Delai SLA:** P1, < 15min reponse, < 2h containment

### 5.2 Fuite de donnees

**Detection:** Alerte DLP, export massif detecte, notification externe

**Actions:**
1. [CONTAIN] Identifier la source de la fuite
2. [CONTAIN] Bloquer l'acces a la ressource
3. [CONTAIN] Revoke tokens/cles compromises
4. [ANALYSE] Determiner l'etendue (quelles donnees, quels utilisateurs)
5. [ANALYSE] Verifier les logs d'acces
6. [ERADICATE] Corriger la vulnerabilite
7. [NOTIFY] Contacter legal/DPO (< 24h CNIL)
8. [NOTIFY] Notifier les utilisateurs impactes
9. [RESTORE] Securiser les donnees restantes

**Delai SLA:** P0, < 5min reponse, < 30min containment

### 5.3 Attaque DDoS

**Detection:** Alertes Cloudflare, monitoring trafic, indisponibilite

**Actions:**
1. [CONTAIN] Activer Cloudflare Under Attack Mode
2. [CONTAIN] Activer rate limiting strict
3. [CONTAIN] Bloquer IP/plages aggressives
4. [ANALYSE] Identifier le type d'attaque (L3/L4/L7)
5. [ANALYSE] Contacter Cloudflare support
6. [ERADICATE] Mettre a jour les regles WAF
7. [RESTORE] Normaliser la configuration apres l'attaque

**Delai SLA:** P1, < 15min reponse, < 1h containment

### 5.4 Ransomware

**Detection:** Alertes de chiffrement, fichiers .lock, note de rancon

**Actions:**
1. [CONTAIN] Isoler le systeme compromis du reseau
2. [CONTAIN] Desactiver les acces distants
3. [CONTAIN] Faire un snapshot forensique
4. [ANALYSE] Identifier le vecteur d'entree
5. [ERADICATE] Reinstaller le systeme depuis une image propre
6. [RESTORE] Restaurer depuis les backups (hors-ligne)
7. [NOTIFY] Contacter autorites (ANSSI)
8. [NOTIFY] Ne pas payer la rancon

**Delai SLA:** P0, < 5min reponse, < 30min containment

### 5.5 Injection SQL / NoSQL

**Detection:** WAF Cloudflare, Prisma query error, logs anormaux

**Actions:**
1. [CONTAIN] Bloquer l'IP source
2. [CONTAIN] Identifier les donnees exposees
3. [ANALYSE] Verifier les parametres d'entree
4. [ERADICATE] Corriger la validation d'entree
5. [ERADICATE] Deployer le correctif
6. [RESTORE] Verifier l'integrite des donnees

**Delai SLA:** P0, < 5min reponse, < 30min containment

### 5.6 Attaque XSS

**Detection:** CSP report, signalement utilisateur, alerte securite

**Actions:**
1. [CONTAIN] Invalider le contenu stocke
2. [CONTAIN] Supprimer le script malveillant
3. [ANALYSE] Identifier les utilisateurs impactes
4. [ANALYSE] Verifier l'etendue (stockee/refletee/DOM)
5. [ERADICATE] Corriger la sortie non encodee
6. [ERADICATE] Renforcer CSP si necessaire

**Delai SLA:** P1, < 15min reponse, < 2h containment

### 5.7 Brute force / Credential stuffing

**Detection:** LoginAttempt multiples depuis IP(s) differentes

**Actions:**
1. [CONTAIN] Bloquer les IP sources
2. [CONTAIN] Activer temporairement CAPTCHA
3. [ANALYSE] Verifier si des comptes sont compromis
4. [ERADICATE] Forcer reset MDP sur comptes cibles
5. [ERADICATE] Activer 2FA obligatoire
6. [RESTORE] Lever les blocages apres validation

**Delai SLA:** P2, < 1h reponse, < 24h containment

### 5.8 Compromission cle API / Token

**Detection:** Activite anormale, alerte securite, fuite detectee

**Actions:**
1. [CONTAIN] Revoke la cle/token compromis
2. [CONTAIN] Generer une nouvelle cle
3. [ANALYSE] Verifier l'utilisation de la cle
4. [ERADICATE] Pivoter les secrets relies
5. [NOTIFY] Informer l'utilisateur si cle personnelle

**Delai SLA:** P1, < 15min reponse, < 1h containment

### 5.9 Compromission infrastructure (serveur, conteneur)

**Detection:** Alerte intrusion, processus anormaux, beaconing C2

**Actions:**
1. [CONTAIN] Isoler l'instance (network policy)
2. [CONTAIN] Faire un memory dump
3. [CONTAIN] Snapshot du disque
4. [ANALYSE] Analyser les logs d'acces
5. [ANALYSE] Identifier la porte d'entree
6. [ERADICATE] Detruire l'instance compromise
7. [ERADICATE] Pivoter tous les secrets
8. [RESTORE] Deployer une instance propre

**Delai SLA:** P0, < 5min reponse, < 30min containment

### 5.10 Attaque SSRF

**Detection:** Tentative d'acces aux metadata cloud, alerte WAF

**Actions:**
1. [CONTAIN] Bloquer le payload malveillant
2. [CONTAIN] Identifier la fonction vulnerable
3. [ANALYSE] Verifier les acces aux services internes
4. [ERADICATE] Corriger l'URL validation
5. [ERADICATE] Restreindre les appels sortants

**Delai SLA:** P1, < 15min reponse, < 2h containment

### 5.11 Compromission de session

**Detection:** Session usurpee, impossible travel detecte, utilisateur signale

**Actions:**
1. [CONTAIN] Revoke la session compromise
2. [CONTAIN] Revoke le refresh token
3. [ANALYSE] Identifier comment le token a ete vole
4. [ERADICATE] Forcer la re-authentification
5. [RESTORE] Emettre un nouveau token apres verification

**Delai SLA:** P1, < 15min reponse, < 2h containment

### 5.12 Attaque OAuth (authorization code interception)

**Detection:** Logs OAuth anormaux, code echange sans session

**Actions:**
1. [CONTAIN] Revoke les tokens OAuth compromis
2. [CONTAIN] Desactiver le provider OAuth concerne
3. [ANALYSE] Verifier les redirect_uri utilisees
4. [ERADICATE] Valider la configuration OAuth
5. [ERADICATE] Mettre a jour les regles CSRF

**Delai SLA:** P1, < 15min reponse, < 2h containment

---

## 6. Outils de reponse

### 6.1 Outils internes

| Outil | Usage | Acces |
|-------|-------|-------|
| Datadog | Monitoring, alerting, dashboards | Admin + SecOps |
| Grafana | Visualisation metriques securite | Admin + SecOps |
| Kibana | Analyse de logs (ELK) | SecOps |
| Bull Board | Gestion files d'attente | Admin |
| Traefik Dashboard | Visualisation routes | Admin |
| Cloudflare Dashboard | WAF, rate limiting, DDoS | Admin |
| Neon Console | PostgreSQL monitoring | Admin |
| Redis Insight | Redis monitoring | Admin |
| MinIO Console | Storage monitoring | Admin |

### 6.2 Outils externes

| Outil | Usage |
|-------|-------|
| Have I Been Pwned | Verification fuite credentials |
| VirusTotal | Analyse IOC (IP, hash, URL) |
| Shodan | Reconnaissance infrastructure exposee |
| CVE Mitre | Recherche vulnerabilites connues |
| AlienVault OTX | Threat intelligence |

### 6.3 Scripts de reponse

```typescript
// scripts/incident/revoke-user.ts
import { sessionManager } from "../src/lib/security/session-manager"
import { prisma } from "../src/lib/db"

async function revokeUser(userId: string, reason: string) {
  const count = await sessionManager.revokeAllSessions(userId)
  await prisma.user.update({ where: { id: userId }, data: { isActive: false, suspendedAt: new Date(), suspensionReason: reason } })
  console.log(`User ${userId}: ${count} sessions revoked, account disabled`)
}

// scripts/incident/block-ip.ts
import { getConnection as getRedis } from "../src/lib/redis-pubsub"

async function blockIP(ip: string, durationMinutes = 60) {
  const redis = getRedis()
  if (redis) {
    await redis.setex(`blocked:ip:${ip}`, durationMinutes * 60, "1")
    console.log(`IP ${ip} blocked for ${durationMinutes} minutes`)
  }
}
```

---

## 7. Communication

### 7.1 Canaux

| Canal | Usage | Confidentialite |
|-------|-------|-----------------|
| Slack #security-incidents | Coordination equipe interne | Prive equipe |
| Slack #security-alerts | Alertes automatisees | Public equipe |
| Phone tree | Escalade urgente | Prive |
| Email | Notification legale, utilisateurs | Externe |
| Statut page | Communication publique | Public |

### 7.2 Templates

**Notification interne (Slack):**
```
[INCIDENT] Niveau: {P0|P1|P2|P3}
Type: {type}
Detection: {date|heure}
Impact: {description}
Status: {detection|analyse|containment|eradication|restauration|post-mortem}
Lead: @{personne}
```

**Notification utilisateur:**
```
Objet: Activite suspecte sur votre compte NBA

Bonjour {prenom},

Nous avons detecte une activite suspecte sur votre compte NBA
le {date} a {heure} depuis {pays} ({ip}).

Si vous etes a l'origine de cette connexion, aucune action n'est requise.
Sinon, veuillez:
1. Changer votre mot de passe immediatement
2. Activer l'authentification a deux facteurs
3. Verifier vos sessions actives

Equipe Securite NBA
```

**Notification CNIL (obligation legale < 72h):**
```
Objet: Notification de violation de donnees personnelles

Conformement a l'article 33 du RGPD, nous notifions une violation
de donnees personnelles impactant {nombre} utilisateurs.

Date de l'incident: {date}
Nature: {description}
Categories de donnees: {categories}
Consequences: {consequences}
Mesures prises: {mesures}
```

---

## 8. Post-mortem et retours d'experience

### 8.1 Structure du post-mortem

```markdown
# Post-mortem: {titre incident}

## Chronologie
- {date} {heure} - {evenement}

## Impact
- Utilisateurs impactes: {nombre}
- Duree d'indisponibilite: {duree}
- Donnees exposees: {types}
- Duree totale resolution: {duree}

## Cause racine (5 Why)
1. Pourquoi? -> {cause}
2. Pourquoi? -> {cause}
3. Pourquoi? -> {cause}
4. Pourquoi? -> {cause}
5. Pourquoi? -> {cause racine}

## Actions correctives
- [ ] {action} - Priority {P0|P1|P2} - Owner @{personne} - Due {date}

## Lessons learned
- Ce qui a bien fonctionne:
- Ce qui a mal fonctionne:
- Ameliorations pour la prochaine fois:

## Metriques
- Time to detect: {duree}
- Time to respond: {duree}
- Time to contain: {duree}
- Time to resolve: {duree}
```

### 8.2 Plan d'action post-incident

| Action | Delai | Owner |
|--------|-------|-------|
| Rediger post-mortem | 48h post-resolution | Incident Commander |
| Implementer actions correctives P0 | 72h | Tech lead |
| Implementer actions correctives P1 | 2 semaines | Tech lead |
| Mettre a jour les runbooks | 1 semaine | SecOps |
| Partager lessons learned | 1 semaine | CTO |

---

## 9. Exercices et tests

### 9.1 Tabletop exercises

| # | Scenario | Type | Frequence | Participants |
|---|----------|------|-----------|--------------|
| TT-01 | Intrusion compte utilisateur | Simulation | Mensuel | CSIRT complet |
| TT-02 | Ransomware | Walkthrough | Trimestriel | CSIRT + CTO |
| TT-03 | Fuite de donnees | Simulation | Trimestriel | CSIRT + Legal |
| TT-04 | DDoS | Walkthrough | Mensuel | SRE + SecOps |
| TT-05 | Brute force massif | Simulation | Mensuel | SecOps |
| TT-06 | Attaque OAuth | Walkthrough | Trimestriel | Dev + SecOps |

### 9.2 Objectifs d'exercice

- Time to detect: < 5min pour P0/P1
- Time to respond: < 15min pour P0/P1
- Time to contain: < 30min pour P0
- Communication correcte dans 100% des cas
- Post-mortem redige dans les 48h

---

## 10. Annexes

### A. Contacts d'urgence

| Contact | Coordonnees |
|---------|-------------|
| Incident Commander | Slack @sre-lead / +33X XX XX XX XX |
| Security Lead | Slack @secops / +33X XX XX XX XX |
| CTO | Slack @cto / +33X XX XX XX XX |
| DPO | Slack @dpo / dpo@nba.com |
| Cloudflare Support | support@cloudflare.com / +1 888 993 5273 |
| Neon Support | support@neon.tech |
| Vercel Support | support@vercel.com |
| ANSSI | contact@ssi.gouv.fr / +33 1 71 75 84 28 |
| CNIL | 0 800 807 000 / https://www.cnil.fr/ |

### B. Liste de verification rapide (P0)

- [ ] Confirmer l'incident (5min)
- [ ] Identifier le type d'incident
- [ ] Contacter Incident Commander
- [ ] Ouvrir canal Slack #security-war-room
- [ ] Activer le confinement initial
- [ ] Capturer les preuves forensiques
- [ ] Notifier le legal/DPO si fuite donnees
- [ ] Demarrer le chronometre d'incident
- [ ] Documenter toutes les actions

### C. Outils de capture forensique

| Outil | Usage |
|-------|-------|
| docker exec | Collecter logs conteneur |
| kubectl get events | Evenements Kubernetes |
| pg_dump | Snapshot base de donnees |
| redis-cli --rdb | Snapshot Redis |
| tcpdump | Capture reseau |
| journalctl | Logs systeme |

### D. References

- NIST SP 800-61 (Computer Security Incident Handling Guide)
- ISO 27035 (Information security incident management)
- ANSSI Guide de reponse aux incidents
- CNIL Violation de donnees personnelles
- OWASP Incident Response Guide
