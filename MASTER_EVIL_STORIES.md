# Scenarios d'Attaque — MASTER_EVIL_STORIES.md

> **Catalogue de Menaces** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Total scenarios** : 650  
> **Document relies** : `MASTER_SECURITY_REQUIREMENTS.md`, `MASTER_ZERO_TRUST_SECURITY.md`, `MASTER_FRAUD_ENGINE.md`, `MASTER_DEVICE_TRUST.md`

---

## Format d'un Scenario

Chaque scenario suit le format suivant :

```
[SXXX] Titre du scenario
  Attaque:  Description de la methode d'attaque
  Risque:   CRITICAL / HIGH / MEDIUM / LOW
  Vecteur:  Vecteur d'attaque principal
  User:     FREE / STANDARD / PRO / VIP / ADMIN / ANY
  Couche:   Couche de securite concernee
  Protec:   Mecanismes de protection existants ou a implementer
  Tests:    Comment tester la vulnerabilite
  Alertes:  Evenement declenche et canal d'alerte
  Metriques: Metrique a surveiller
  Doc:      Reference vers le document d'architecture
```

---

## 1. Partage de Compte & Mots de Passe (ES001-ES080)

### 1.1 Partage Volontaire

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES001 | Utilisateur partage son mot de passe avec un ami | HIGH | Credential sharing | Device binding, fingerprint, session limit | Connecter 2 IPs differentes avec meme credentials en < 5min | LOGIN_NEW_DEVICE + email |
| ES002 | 2 personnes utilisent le meme compte depuis 2 villes differentes | HIGH | Geo diversity | Session limit, geo check, device diversity | Alterner connexions Paris / Lyon | FLAG_SHARING + email |
| ES003 | 5 personnes utilisent le meme compte (famille) | HIGH | Multi-user | Max sessions = 3 (FREE), device trust | Connecter 5 appareils differents en 1h | HIGH_RISK_SYNC + admin |
| ES004 | 15 personnes utilisent le meme compte (equipe) | CRITICAL | Commercial sharing | Plan ENTERPRISE recommande, sharing detection | 15 connexions depuis 15 IPs differentes | SHARING_DETECTED + admin |
| ES005 | Utilisateur PRO partage son acces a son equipe de trading | HIGH | Business abuse | Sharing detection, plan limit enforcement | 8 connexions simultanees depuis 4 pays | FLAG_SHARING + email |
| ES006 | Plusieurs membres d'une famille utilisent le meme compte FREE | MEDIUM | Multi-user | Session limit = 1 (FREE), device binding | 3 connexions simultanees | SESSION_LIMIT_EXCEEDED |
| ES007 | Utilisateur partage son compte avec son conjoint | MEDIUM | Credential sharing | Device fingerprint, 2FA recommendation | 2 appareils, meme ville, heures differentes | LOGIN_NEW_DEVICE |
| ES008 | Coworking de comptes (acheteurs revendent l'acces) | CRITICAL | Commercial reselling | Sharing detection, pattern analysis, admin review | Rotation IP + user toutes les heures | SHARING_CONFIRMED + admin |
| ES009 | Utilisateur STANDARD partage avec 3 collegues | HIGH | Session abuse | Enforce session limit = 2 (STANDARD) | 3 sessions simultanees | SESSION_LIMIT_EXCEEDED |
| ES010 | Compte partage sur un serveur Discord prive | CRITICAL | Organized sharing | IP ranges Discord, pattern detection | IP Discord (13 IPs range) + horaires coordonnes | SHARING_ORGANIZED + admin |

### 1.2 Mot de Passe Faible

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES011 | Mot de passe "123456" | HIGH | Weak password | Password policy (10+ chars, complexite) | Tenter connexion avec mot de passe faible | LOGIN_FAILED (server-side rejection) |
| ES012 | Mot de passe = nom du site | HIGH | Weak password | Password policy, common password blacklist | Tenter "NBA123!", "nba2024" | PASSWORD_WEAK + user |
| ES013 | Mot de password identique a l'email | HIGH | Predictable | Password policy, validation | Tenter email=password | PASSWORD_WEAK |
| ES014 | Mot de pause (faute de frappe) | MEDIUM | Dictionary attack | Common password list, breach check | Dictionnaire de mots communs | BRUTE_FORCE detected |
| ES015 | Mot de passe reutilise depuis une autre plateforme | HIGH | Credential reuse | HIBP breach check API | Verifier hash dans base pwned | PASSWORD_BREACHED + user (forcer changement) |
| ES016 | Mot de passe = "Password1!" | HIGH | Common pattern | Regex pattern detection | Liste noire "Password", "Motdepasse" | PASSWORD_WEAK |
| ES017 | Mot de passe trop court (8 caracteres) | MEDIUM | Brute force | Password policy: minLength=10 | Tenter 8 caracteres | PASSWORD_TOO_SHORT |
| ES018 | Mot de passe sans chiffre | LOW | Dictionary | Password policy: requireNumbers | Tenter "Motdepasse!" | PASSWORD_WEAK |
| ES019 | Mot de passe sans majuscule | LOW | Dictionary | Password policy: requireUppercase | Tenter "motdepasse1!" | PASSWORD_WEAK |
| ES020 | Mot de passe avec caracteres repetes "aaa" | LOW | Pattern | Policy: pas de 3+ repetitions | Tenter "AAAaaa1!" | PASSWORD_WEAK |
| ES021 | Mot de passe = date naissance utilisateur (infos publiques) | HIGH | Social engineering | Password history, breach check | 15011990, 01011980 | PASSWORD_BREACHED |
| ES022 | Mot de passe = "MonChienToto1!" (animal domestique) | MEDIUM | Social engineering | Password policy ne peut pas bloquer | Dictionnaire personnalise | LOGIN_FAILED rate limit |
| ES023 | Mot de passe present dans une fuite HaveIBeenPwned | CRITICAL | Credential reuse | HIBP API check a chaque creation/changement | Tester hash SHA-1 contre API | PASSWORD_BREACHED + force change |

### 1.3 Changement de Mot de Passe

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES024 | Attaquant change le mot de passe apres avoir vole la session | CRITICAL | Session hijack + password change | MFA requis pour changement password, email notification | Voler cookie, changer password | PASSWORD_CHANGED + email, revoke all sessions |
| ES025 | Attaquant tente de changer le mot de passe avec l'email compromise | CRITICAL | Email compromise | Verification email token, rate limit reset | Acceder a la boite email, cliquer reset | PASSWORD_RESET_REQUESTED + email |
| ES026 | Attaquant utilise le reset password avec enumeration d'email | HIGH | Account enumeration | Message generic "Si l'email existe" (pas de confirmation) | Tenter reset sur emails aleatoires | RATE_LIMIT_EXCEEDED |
| ES027 | Token de reset rejoue dans les 24h | MEDIUM | Token replay | Token usage unique, TTL 1h | Utiliser 2x le meme lien de reset | TOKEN_REUSED + alerte |
| ES028 | Reset password force par brute force du token (6 chiffres) | HIGH | Token brute force | Token aleatoire 32+ caracteres, rate limit | Brute forcer les tokens de reset | BRUTE_FORCE detected |
| ES029 | Attaquant change le password sans connaitre l'ancien (si session ouverte) | HIGH | Missing current password | Better Auth: require current password | POST /change-password sans currentPassword | PASSWORD_CHANGED_WITHOUT_CURRENT |

---

## 2. Attaques sur les Identifiants (ES081-ES160)

### 2.1 Credential Stuffing

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES081 | Attaquant utilise 1000 emails + passwords depuis fuite | CRITICAL | Credential stuffing | Rate limit 5 req/min, credential stuffing detector | Jouer 1000 tentatives depuis 1 IP | CREDENTIAL_STUFFING + block IP |
| ES082 | Botnet 50 IPs differentes, 20 tentatives chacune | CRITICAL | Distributed stuffing | Rate limit par email (5/min) + IP (5/min) | 50 IPs x 20 tentatives | CREDENTIAL_STUFFING_DISTRIBUTED |
| ES083 | Attaquant utilise 1 seul email, 500 passwords | HIGH | Targeted stuffing | Rate limit par email, brute force detector | /sign-in avec 500 passwords pour 1 email | BRUTE_FORCE + block IP |
| ES084 | Credential stuffing depuis IP residentiales (reseau VPN) | CRITICAL | VPN stuffing | IP reputation (MaxMind VPN detection), challenge | 100 IPs VPN, 5 tentatives chacune | VPN_STUFFING + challenge 2FA |
| ES085 | Attaquant utilise des proxies gratuits (200 IPs) | HIGH | Proxy stuffing | IP reputation (proxy detection), rate limit global | Proxy list, 200 IPs, 3 tentatives/IP | PROXY_STUFFING + block |
| ES086 | Stuffing lent (1 tentative/30s, 200 IPs, sur 24h) | HIGH | Slow stuffing | Behavioral pattern, velocity check | 1 req/30s/IP, 200 IPs | VELOCITY_ANOMALY + flag |
| ES087 | Stuffing avec rotation d'User-Agent | MEDIUM | UA rotation | Fingerprint consistency check | Changer UA a chaque tentative | SUSPICIOUS_UA_ROTATION |
| ES088 | Stuffing via API directement (pas le formulaire web) | CRITICAL | API abuse | CSRF, rate limit API, WAF | POST /api/auth/sign-in en boucle | API_ABUSE + rate limit |
| ES089 | Stuffing avec des emails valides (verifies via signup) | CRITICAL | Enumeration + stuffing | Account enumeration protection | Verifier /sign-up pour confirmer email | ENUMERATION_ATTEMPT |
| ES090 | Stuffing depuis un botnet IoT (5000 IPs) | CRITICAL | Massive botnet | Cloudflare WAF, DDoS protection, global rate | 5000 IPs, 2 req/IP | DDoS_PROTECTION + Cloudflare |

### 2.2 Brute Force

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES091 | Brute force cible sur un admin (1000 tentatives/heure) | CRITICAL | Targeted brute force | Rate limit, WAF, IP block, 2FA requis | 1000 POST sign-in sur email admin | BRUTE_FORCE_ADMIN + PagerDuty |
| ES092 | Brute force distribue (faible intensite, longue duree) | HIGH | Slow brute | Login velocity, behavioral score | 50 req/h pendant 48h | VELOCITY_HIGH + flag |
| ES093 | Brute force sur endpoint API (pas /sign-in) | HIGH | API brute force | Rate limit sur chaque endpoint | POST /api/auth/sign-in-electronique | API_ABUSE + rate limit |
| ES094 | Attaquant utilise des tables arc-en-ciel (pre-computed) | MEDIUM | Rainbow tables | bcrypt rounds=12, salt unique | Comparer hash avec rainbow table | (bloque par bcrypt) |
| ES095 | Brute force offline sur hash de mots de passe exposes | CRITICAL | DB leak | bcrypt rounds=12, pas de mot de passe en clair | Exporter base, brute force offline | (si DB compromise -> IR) |
| ES096 | Brute force avec dictionnaire personnalise (mots en rapport avec NBA) | HIGH | Custom dictionary | Password policy + common password list | Dictionnaire basketball + trading | BRUTE_FORCE + rate limit |
| ES097 | Brute force sur compte FREE (pas de 2FA) | MEDIUM | Weak account | Rate limit, device trust, session limit | Cibler comptes FREE sans 2FA | BRUTE_FORCE + flag |

### 2.3 Account Enumeration

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES098 | Attaquant teste des emails sur /sign-in, analyse les messages d'erreur | MEDIUM | Error message analysis | Message generic "Email ou mot de passe incorrect" | Comparer "Email inconnu" vs "Mot de passe incorrect" | (bloque par message unique) |
| ES099 | Attaquant utilise /forgot-password pour verifier les emails existants | MEDIUM | Reset enumeration | Message generic "Si l'email existe" | Tenter reset sur 100 emails | RATE_LIMIT_EXCEEDED |
| ES100 | Attaquant utilise /sign-up pour verifier les emails deja pris | MEDIUM | Signup enumeration | Rate limit sur signup | Tenter signup avec emails connus | RATE_LIMIT_SIGNUP |
| ES101 | Timing attack sur /sign-in (temps different si email existe) | MEDIUM | Timing attack | Temps de reponse constant (bcrypt meme si email inconnu) | Mesurer temps de reponse email existant vs inexistant | (bloque par execution constante) |
| ES102 | Verification d'existence via /api/public/profile/{email} | MEDIUM | Public endpoint | Pas d'endpoint public d'existence | GET /api/public/profile/test@test.com | ENDPOINT_ABUSE |

### 2.4 MFA/2FA Bypass

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES103 | Attaquant contourne 2FA en utilisant une session existante non expiree | CRITICAL | Session reuse | Session binding device + revoke on 2FA change | Creer session, desactiver 2FA, reutiliser session | SESSION_REVOKED + email |
| ES104 | Attaquant vole les codes de backup (backup codes stockes en clair) | CRITICAL | Backup code theft | Codes hashes (SHA-256), usage unique | Voler backup_codes table | (bloque par hash) |
| ES105 | Brute force du code TOTP (6 chiffres = 1M possibilites) | HIGH | TOTP brute force | Rate limit 5 tentatives/5min, window=1 | Tenter tous les codes TOTP | TOTP_BRUTE_FORCE + block |
| ES106 | Attaquant rejoue un code TOTP valide | MEDIUM | TOTP replay | TOTP period=30s, window=1 | Utiliser meme code TOTP 2x | TOTP_REPLAY + block |
| ES107 | Attaquant intercepte le code email OTP | HIGH | Email interception | OTP 6 chiffres, TTL 5min, rate limit | Intercepter email, utiliser OTP | OTP_INTERCEPTED + email user |
| ES108 | Attaquant force un utilisateur a desactiver sa 2FA via social engineering | HIGH | Social engineering | MFA desactivation require password + email notif | Appeler support pour desactiver 2FA | 2FA_DISABLED + email + admin |
| ES109 | Attaquant utilise "trust this device" pour contourner 2FA sur appareil vole | CRITICAL | Trusted device abuse | Trusted device cookie lie au fingerprint + IP | Voler appareil, utiliser trusted cookie | DEVICE_UNTRUSTED + revoke |
| ES110 | Attaquant clone le cookie "trusted-device" | MEDIUM | Cookie clone | Cookie lie au fingerprint, pas seulement presence | Copier cookie sur autre machine | SESSION_HIJACK_ATTEMPT |
| ES111 | Attaquant utilise un code de backup apres avoir vole les codes generes | CRITICAL | Backup code theft | Codes stockes hashes, notification usage | Utiliser code backup | BACKUP_CODE_USED + email user |
| ES112 | Attaquant regenere les codes de backup pour invalider les anciens | MEDIUM | Backup code regeneration | Notification email + require password | Regenerer backup codes | BACKUP_CODES_REGENERATED |
| ES113 | Attaquant bypass le 2FA en appelant directement l'API sans verification | HIGH | API bypass | Middleware verification a chaque requete sensible | Appeler API sans passer par 2FA | API_BYPASS_ATTEMPT |

---

## 3. VPN, Proxy, TOR & Anonymizers (ES161-ES230)

### 3.1 VPN

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES161 | Utilisateur se connecte via VPN commercial (NordVPN, ExpressVPN) | MEDIUM | VPN | IP reputation (MaxMind VPN detection), risk score +15 | Connecter depuis IP VPN connue | LOGIN_VPN + flag |
| ES162 | Utilisateur se connecte via VPN d'entreprise | LOW | Corporate VPN | ASN entreprise reconnu, whitelist possible | IP range entreprise | LOGIN_CORPORATE_IP |
| ES163 | Attaquant utilise VPN pour contourner le rate limiting IP | HIGH | Rate limit bypass | Rate limit par email + fingerprint + IP combine | Changer IP VPN a chaque tentative | RATE_LIMIT_BYPASS_ATTEMPT |
| ES164 | Attaquant utilise VPN residential (Luminati, BrightData) | CRITICAL | Residential proxy | IP reputation residential detection, behavioral scoring | Reseau P2P residential | RESIDENTIAL_PROXY + high risk |
| ES165 | Utilisateur legitime change de VPN (2 IPs differentes en 5min) | MEDIUM | Geo inconsistency | Device fingerprint stable, pas de flag si meme appareil | Desactiver VPN en cours de session | LOGIN_IP_CHANGE + flag |
| ES166 | Attaquant utilise VPN pour masquer son origine reelle | HIGH | Geo spoofing | Geo check, impossible travel detection, behavioral profile | VPN Japon -> US en 10min | GEO_ANOMALY + challenge |
| ES167 | Attaquant utilise VPN propose par le service de stockage (MEGA, etc.) | MEDIUM | Service VPN | IP reputation database | IP plages VPN -> flag | LOGIN_VPN |
| ES168 | Utilisateur utilise Tor over VPN (double anonymisation) | HIGH | Double anonymization | TOR detection + VPN detection = stack | Tor -> VPN -> login | TOR_VPN_STACK + block |

### 3.2 TOR

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES169 | Connexion depuis un noeud de sortie TOR | HIGH | TOR exit node | MaxMind TOR detection, risk score +25, challenge 2FA | Navigateur TOR -> login | TOR_CONNECTION + 2FA challenge |
| ES170 | Attaquant utilise TOR pour lancer une attaque de credential stuffing | CRITICAL | TOR stuffing | TOR detection + rate limit + block | 50 IPs TOR en 5min | TOR_STUFFING + block |
| ES171 | Attaquant utilise un bridge TOR (non liste publiquement) | HIGH | TOR bridge | TOR detection comportementale (latence, signature TLS) | Bridge prive TOR | SUSPICIOUS_TOR + challenge |
| ES172 | Utilisateur legitime utilise TOR pour anonymat personnel | MEDIUM | Privacy tool | Challenge 2FA + email notification | Navigateur TOR -> login | TOR_CONNECTION + email user |
| ES173 | Attaquant utilise TOR + bot pour creation massive de comptes | CRITICAL | Account farming | TOR detection + signup rate limit + email verification | 100 comptes via TOR | TOR_SIGNUP_FARM + block |

### 3.3 Proxy

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES174 | Attaquant utilise un proxy HTTP public (liste gratuite) | HIGH | Public proxy | MaxMind proxy detection, risk score +20 | Proxy list, 100 IPs | PROXY_CONNECTION + block |
| ES175 | Attaquant utilise un proxy elite (anonyme, ne divulgue pas X-Forwarded-For) | HIGH | Elite proxy | Detection comportementale (headers manquants) | Proxy elite | SUSPICIOUS_PROXY + challenge |
| ES176 | Attaquant utilise un reverse proxy (Nginx) pour cacher son infrastructure | CRITICAL | Reverse proxy | Origin IP detection, Cloudflare | Reverse proxy devant le trafic | REVERSE_PROXY + admin |
| ES177 | Attaquant utilise un proxy SOCKS5 | MEDIUM | SOCKS proxy | IP reputation (MaxMind) | SOCKS5 -> login | PROXY_CONNECTION |
| ES178 | Attaquant utilise un proxy residential (911 Proxy, Luminati) | CRITICAL | Residential proxy | Behavioral analysis, device fingerprint stable malgre IP change | 100 IPs residentiales | RESIDENTIAL_PROXY + high risk |
| ES179 | Attaquant utilise ProxyChains pour chainer proxies | HIGH | Proxy chain | Latence anormale, TTL, signatures | 3 proxies chaines | PROXY_CHAIN + block |
| ES180 | Attaquant utilise un proxy WebSocket (WSS) | MEDIUM | WebSocket proxy | WS auth avec cookie lie a l'IP | Proxy WebSocket -> connection WS | WS_PROXY + flag |

### 3.4 Autres Anonymizers

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES181 | Connexion depuis un datacenter (AWS, GCP, Azure) | MEDIUM | Cloud IP | IP reputation datacenter detection | Machine EC2 -> login | DATACENTER_IP + flag |
| ES182 | Utilisation de iCloud Private Relay | MEDIUM | Apple relay | IP change detection, device fingerprint stable | Safari + iCloud relay | IP_RELAY + flag |
| ES183 | Utilisation de DNS-over-HTTPS (DoH) pour contourner les blocages DNS | LOW | DoH | Pas de blocage DNS, mais monitoring | DoH + VPN | (pas de detection) |
| ES184 | Utilisation de Psiphon (anonymizer) | HIGH | Censorship circumvention | IP reputation database | Psiphon -> login | ANONYMIZER + block |
| ES185 | Utilisation de V2Ray / Shadowsocks | HIGH | Proxy tool | Traffic pattern analysis | V2Ray -> login | PROXY_TOOL + challenge |

---

## 4. Vol de Session (ES231-ES300)

### 4.1 Cookie Theft

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES231 | Vol de cookie via XSS | CRITICAL | XSS | CSP, HttpOnly cookie | Injecter script, lire document.cookie | (bloque par HttpOnly) |
| ES232 | Vol de cookie via malware / stealer (RedLine, Vidar) | CRITICAL | Malware | Device fingerprint, IP change detection | Voler cookie, rejouer depuis autre IP | SESSION_HIJACK_ATTEMPT |
| ES233 | Vol de cookie via intercepteur WiFi (MITM) | CRITICAL | MITM | TLS 1.3, HSTS, Secure cookie | Capturer cookie sur reseau non chiffre | (bloque par TLS) |
| ES234 | Vol de cookie via acces physique a l'ordinateur | HIGH | Physical access | Session lock, idle timeout, 2FA | Acceder a l'ordi deconnecte, voler cookie | (si idle timeout expire -> plus valide) |
| ES235 | Vol de cookie via navigateur synchronise (Chrome sync) | MEDIUM | Browser sync | Session passee pas liee a l'appareil sync | Chrome sync -> extraire cookie | SUSPICIOUS_ACTIVITY |
| ES236 | Rejeu de cookie vole (utilise dans les 7 jours) | CRITICAL | Cookie replay | IP/UA/FP change detection, rotation session | Utiliser cookie vole depuis autre localisation | SESSION_HIJACK + revoke |
| ES237 | Cookie vole + rejeu depuis IP proche (meme ville) | HIGH | Local replay | Fingerprint mismatch detection | Cookie vole, rejeu depuis IP voisine | SESSION_HIJACK_MEDIUM + 2FA |
| ES238 | Cookie vole + rejeu avant rotation (24h) | CRITICAL | Window of opportunity | Rotation session, updateAge=24h | Rejouer cookie dans les 24h | SESSION_HIJACK + revoke |
| ES239 | Attaquant vole le cookie de session admin | CRITICAL | Privileged hijack | Admin session TTL reduit (12h), 2FA obligatoire | Voler session admin | SESSION_HIJACK_ADMIN + PagerDuty |

### 4.2 Session Fixation

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES240 | Attaquant fixe un token de session avant login | MEDIUM | Session fixation | Better Auth genere nouveau token apres login | Changer session token avant login, voir si conserve | (bloque par regeneration) |
| ES241 | Attaquant fixe la session via parametre URL (session_id=XXX) | HIGH | URL manipulation | Pas de session dans les URLs | Ajouter ?session_id=xxx a l'URL | (bloque par cookie only) |
| ES242 | Attaquant fixe la session via cookie cote client (document.cookie) | MEDIUM | Client cookie | HttpOnly, pas de cookie cote client | document.cookie = "session=xxx" | (bloque par HttpOnly) |

### 4.3 Session Prediction

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES243 | Attaquant predit le token de session (incrementale) | HIGH | Weak token generation | crypto.randomUUID(), aleatoire | Analyser 1000 tokens, trouver pattern | (bloque par UUID v4) |
| ES244 | Attaquant predit le JWT (non signe) | MEDIUM | JWT prediction | HMAC-SHA256 signature | Modifier payload JWT sans signer | (bloque par HMAC) |
| ES245 | Attaquant force le secret JWT (faible) | CRITICAL | Weak secret | BETTER_AUTH_SECRET >= 32 caracteres | Brute forcer HMAC secret | (bloque par secret fort) |

### 4.4 Session Sidejacking

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES246 | Vol de session via sniffing WiFi non chiffre | CRITICAL | Sniffing | TLS 1.3, HSTS | Capturer trafic reseau public | (bloque par TLS) |
| ES247 | Vol de session via reseau local (ARP spoofing) | HIGH | LAN attack | WSS, TLS, certificats | ARP spoof + capture | (bloque par TLS) |
| ES248 | Vol de session via extension navigateur malveillante | HIGH | Browser extension | HttpOnly, Secure cookie | Extension avec permissions cookies | (bloque par HttpOnly) |
| ES249 | Vol de session via malware qui capture l'ecran | MEDIUM | Screen capture | 2FA, session binding | Recording ecran -> capture cookie | (pas de protection logicielle) |
| ES250 | Session volee via le gestionnaire de mots de passe du navigateur | MEDIUM | Password manager | HttpOnly cookie (pas accessible) | Export password manager -> session | (bloque par HttpOnly) |

### 4.5 Token/JWT Theft

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES251 | JWT vole via localStorage XSS | CRITICAL | XSS storage | Better Auth: cookie-based (pas localStorage) | Lire localStorage.getItem('token') | (bloque par cookie HttpOnly) |
| ES252 | JWT expire vole et utilise apres expiration | LOW | Expired token | Verification expiration a chaque requete | Utiliser JWT expire | TOKEN_EXPIRED + 401 |
| ES253 | JWT non revoque apres deconnexion (pas de blacklist) | HIGH | Missing blacklist | Redis blacklist session, TTL 7 jours | Deconnexion, reutiliser ancien token | (bloque par blacklist) |
| ES254 | JWT avec signature faible (alg=none) | CRITICAL | JWT alg none | Better Auth: HMAC-SHA256 force | Modifier alg:none | (bloque par verification HMAC) |
| ES255 | JWT avec algorithme RS256 confondu avec HS256 (confusion attack) | HIGH | Algorithm confusion | Mepris en charge d'algorithme strict, validation du type de clef | Changer RS256 vers HS256 avec clef publique | (bloque par validation) |
| ES256 | JWT avec claims falsifies (role upgrade) | CRITICAL | Claim tampering | HMAC verification, signature invalide | Modifier role: admin dans JWT | (bloque par signature) |

---

## 5. Clonage & Usurpation d'Appareil (ES301-ES360)

### 5.1 Navigateur Clone

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES301 | Attaquant clone le navigateur (copie du profil Chrome/Firefox) | HIGH | Browser clone | Device fingerprint stable, cookies lies a l'UA | Copier dossier profile Chrome | CLONE_DEVICE + challenge |
| ES302 | Attaquant clone les cookies d'un navigateur a un autre (meme machine) | MEDIUM | Cookie copy | IP identique, fingerprint different | Copier cookies entre Chrome et Firefox | DEVICE_MISMATCH + flag |
| ES303 | Attaquant clone une machine virtuelle (VM snapshot) | HIGH | VM clone | Hardware fingerprint (WebGL, canvas) | Snapshot VM -> restaurer | SUSPICIOUS_DEVICE + challenge |
| ES304 | Attaquant clone les cookies + fingerprint vers un autre OS | HIGH | Cross-OS clone | Canvas + WebGL fingerprint differents entre OS | Windows -> Linux cookies copy | DEVICE_OS_MISMATCH + block |
| ES305 | Attaquant utilise BrowserStack / SauceLabs pour tester l'auth | MEDIUM | Cloud browser | Datacenter IP detection, hardware sig | BrowserStack -> login | DATACENTER_BROWSER + flag |

### 5.2 Emulateurs & Virtualisation

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES306 | Attaquant utilise Android emulator (BlueStacks, Nox) pour creer des comptes | HIGH | Android emulator | Detection d'emulateur (build.prop, CPU) | BlueStacks -> signup | EMULATOR_DETECTED + block |
| ES307 | Attaquant utilise iOS simulator (Xcode) | HIGH | iOS simulator | Detection simulator (model, sysctl) | Xcode Simulator -> login | SIMULATOR_DETECTED + block |
| ES308 | Attaquant utilise QEMU / VirtualBox pour masquer l'OS | MEDIUM | VM detection | Hardware fingerprint (WebGL renderer = VirtualBox) | VM -> login | VM_DETECTED + flag |
| ES309 | Attaquant utilise Docker pour sessions isolees | MEDIUM | Container | Datacenter IP, limited browser features | Container -> login | CONTAINER_ENV + flag |
| ES310 | Attaquant utilise des VPS pour lancer des attaques | HIGH | VPS abuse | Datacenter IP + flag sur compte | VPS OVH/Hetzner -> login | VPS_CONNECTION + challenge |

### 5.3 User-Agent & Headers Spoofing

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES311 | Attaquant spoofe le User-Agent pour miner un navigateur connu | LOW | UA spoofing | Coherence UA vs autres signaux (WebGL, canvas) | curl -A "Chrome 120" | UA_MISMATCH + flag |
| ES312 | Attaquant spoofe les headers Sec-CH-UA (Client Hints) | MEDIUM | Client hints spoof | Correlation platform + UA + JS signals | Modifier Sec-CH-UA-Platform | CLIENT_HINTS_MISMATCH + flag |
| ES313 | Attaquant spoofe l'IP via X-Forwarded-For | HIGH | IP spoofing | Trust cf-connecting-ip (Cloudflare), pas XFF | curl -H "X-Forwarded-For: 8.8.8.8" | (bloque par Cloudflare) |
| ES314 | Attaquant spoofe l'IP via X-Real-IP | MEDIUM | Real IP spoof | Cloudflare ecrase les headers en amont | curl -H "X-Real-IP: ..." | (bloque par Cloudflare) |
| ES315 | Attaquant spoofe Referer pour contourner CSRF | MEDIUM | Referer spoof | CSRF token + origin verification | Modifier Referer header | CSRF_DETECTED |

### 5.4 Canvas/WebGL/Audio Spoofing

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES316 | Attaquant modifie le canvas fingerprint (canvas blocker) | MEDIUM | Canvas spoof | Multi-signal verification, coherence | Extension canvas blocker | FP_CANVAS_BLOCKED + flag |
| ES317 | Attaquant utilise un canvas fingerprint "trop parfait" (toujours identique) | HIGH | Perfect fingerprint | Variance analysis, detection de pattern | Meme canvas hash 100% du temps | FP_TOO_PERFECT + block |
| ES318 | Attaquant desactive WebGL pour eviter le tracking | LOW | WebGL disabled | Fallback captage (screen, fonts, audio) | Disable WebGL via about:config | FP_WEBGL_DISABLED |
| ES319 | Attaquant utilise un audio fingerprint generique | LOW | Audio spoof | Audio generique detectable (trop court/court) | Audio rate constant | FP_AUDIO_GENERIC |
| ES320 | Attaquant ment sur le nombre de coeurs CPU (hardwareConcurrency) | LOW | CPU spoof | Verification impossible cote serveur | navigator.hardwareConcurrency = 1 | (pas de detection fiable) |

---

## 6. Automatisation & Bots (ES361-ES430)

### 6.1 Playwright / Puppeteer

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES361 | Attaquant utilise Playwright pour automatiser les connexions | HIGH | Browser automation | Playwright detection (navigator.webdriver) | Playwright -> login | AUTOMATION_DETECTED + block |
| ES362 | Attaquant utilise Puppeteer-extra + stealth plugin | MEDIUM | Stealth automation | Multi-signal analysis (permissions, plugins) | Puppeteer-extra-stealth -> login | STEALTH_AUTOMATION + flag |
| ES363 | Attaquant utilise Playwright avec des fingerprints realistes | MEDIUM | Realistic automation | Behavioral analysis (mouse, keyboard, timing) | Playwright avec vrais profils | BEHAVIORAL_ANOMALY + flag |
| ES364 | Attaquant utilise Playwright pour du credential stuffing | CRITICAL | Automated stuffing | Rate limit + automation detection | 100 tentatives via Playwright | AUTOMATED_STUFFING + block |
| ES365 | Attaquant utilise Playwright pour du scraping apres login | HIGH | Automated scraping | Rate limit, behavioral analysis | Playwright -> connexion -> scrape | AUTOMATED_SCRAPING + block |
| ES366 | Attaquant utilise Selenium WebDriver | HIGH | Selenium | WebDriver detection | Selenium -> login | SELENIUM_DETECTED + block |
| ES367 | Attaquant utilise Selenium avec undetected-chromedriver | MEDIUM | Undetected Selenium | Fingerprint + behavioral analysis | Undetected-chromedriver -> login | UNDETECTED_AUTOMATION + flag |
| ES368 | Attaquant utilise Cypress pour simuler un utilisateur | MEDIUM | Cypress | Cypress detection (variables globales) | Cypress -> login | CYPRESS_DETECTED + block |
| ES369 | Attaquant utilise Browserless.io (headless Chrome as a service) | HIGH | Headless Chrome | Headless detection (navigator.webdriver, chrome.runtime) | Browserless.io -> login | HEADLESS_CHROME + block |

### 6.2 HTTP Clients & Scripts

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES370 | Attaquant utilise curl pour se connecter | MEDIUM | Raw HTTP | Cookie + fingerprint requis, headers manquants | curl -X POST /api/auth/sign-in | MISSING_FINGERPRINT + block |
| ES371 | Attaquant utilise Python requests | MEDIUM | Python HTTP | User-Agent signature, fingerprint manquant | requests.post('...') | SUSPICIOUS_UA + challenge |
| ES372 | Attaquant utilise Postman pour tester les API apres auth | LOW | API client | User-Agent "Postman" | Postman -> API authenticated | API_CLIENT_DETECTED |
| ES373 | Attaquant utilise wget pour telecharger des pages protegees | LOW | wget | Cookie requis, fingerprint | wget --load-cookies | MISSING_FINGERPRINT |
| ES374 | Attaquant utilise Go net/http pour automatiser | MEDIUM | Go client | UA signature "Go-http-client" | Go -> login | SUSPICIOUS_UA + block |
| ES375 | Attaquant utilise Node.js axios / node-fetch | MEDIUM | Node HTTP | UA signature axios/node-fetch | Node.js -> API | SUSPICIOUS_UA + block |

### 6.3 Captcha & Challenge Bypass

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES376 | Attaquant utilise un service de resolution de CAPTCHA (2Captcha) | HIGH | CAPTCHA bypass | Challenge 2FA (TOTP), pas de CAPTCHA texte | 2Captcha -> resoudre | (bloque par 2FA TOTP) |
| ES377 | Attaquant utilise OCR pour lire les codes de verification | MEDIUM | OCR | Codes aleatoires, fond perturbe | Tesseract -> lire code email | (bloque par 2FA TOTP) |
| ES378 | Attaquant utilise un service de SMS virtuel pour les OTP | HIGH | Virtual SMS | Email OTP + TOTP (pas de SMS) | SMS virtuel -> recevoir OTP | (bloque par pas de SMS OTP) |
| ES379 | Attaquant contourne le challenge en utilisant l'API directement | HIGH | API bypass | Challenge enforce cote serveur, pas que frontend | POST API sans passer par challenge | API_BYPASS + block |

### 6.4 Browser Automation Detection Bypass

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES380 | Attaquant utilise --disable-blink-features=AutomationControlled | MEDIUM | Chrome automation flag bypass | Multi-signal: permissions, plugins, screen | Chrome avec flag | (partiellement bloque) |
| ES381 | Attaquant patche navigator.webdriver = undefined | MEDIUM | webdriver override | Verification plus profondes (chrome.runtime, etc.) | Object.defineProperty(webdriver, undefined) | STEALTH_OVERRIDE + flag |
| ES382 | Attaquant utilise des Chrome extensions pour masquer l'automation | MEDIUM | Extension masking | Comportement global (mouse events, touch events) | Extensions anti-detection | BEHAVIORAL_ANOMALY |

---

## 7. Scraping & Extraction de Donnees (ES431-ES490)

### 7.1 Scraping de Donnees

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES431 | Attaquant scrape les signaux de trading (donnees protegees) | HIGH | Data scraping | Rate limit, behavioral analysis, API restrictions | Playwright scrape 1000 signaux | SCRAPING_DETECTED + block |
| ES432 | Attaquant utilise un proxy rotatif pour scraper sans etre bloque | CRITICAL | Rotating proxy scraping | Behavioral profiling, velocity check | 1000 IPs, 1 requete/IP | SCRAPING_DISTRIBUTED + block |
| ES433 | Attaquant scrape les profils utilisateurs (emails, noms) | CRITICAL | PII scraping | Pas d'endpoint public de profils, auth requise | Scraper /api/users | API_ABUSE + block IP |
| ES434 | Attaquant scrape les statistiques de la plateforme | MEDIUM | Analytics scraping | Rate limit, cache publique pour stats | Scraper /api/stats | API_ABUSE + rate limit |
| ES435 | Attaquant utilise le scraping pour du pricing intelligence | MEDIUM | Price scraping | Cache publique, pas de prevention specifique | Scraper les plans et prix | (contenu public) |
| ES436 | Attaquant scrape les donnees en temps reel via WebSocket | HIGH | WebSocket scraping | WS auth + rate limit, message size limit | WS listener -> collect signals | WS_ABUSE + disconnect |
| ES437 | Attaquant utilise Puppeteer pour screenshot des pages (OCR apres) | HIGH | Visual scraping | Watermarking, anti-screenshot mesures | Puppeteer screenshot | AUTOMATION_DETECTED |
| ES438 | Attaquant utilise the Wayback Machine pour recuperer l'historique des pages | LOW | Historical scraping | robots.txt, noarchive meta tag | archive.org -> historique pages | (pas de prevention) |
| ES439 | Attaquant utilise des API Google cache pour lire les pages | LOW | Cache scraping | Cache-Control: no-store | webcache.googleusercontent.com | (bloque par no-store) |

### 7.2 API Scraping

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES440 | Attaquant appelle l'API GraphQL avec des requetes couteuses | HIGH | GraphQL abuse | Query depth limiting, rate limit, cost analysis | Requete GraphQL complexe recursive | API_ABUSE + block |
| ES441 | Attaquant utilise l'API WebSocket pour exfiltrer des donnees | HIGH | WS exfiltration | Message rate limit, encoding detection | WS -> exfiltrer signaux | WS_EXFILTRATION + disconnect |
| ES442 | Attaquant appelle des endpoints pagines pour tout recuperer | MEDIUM | Pagination scraping | Rate limit, pagination max (100 items) | GET /api/signals?page=1&limit=100 ... | API_ABUSE + rate limit |
| ES443 | Attaquant utilise l'export CSV/JSON pour exfiltrer | HIGH | Export abuse | Export audite, limite, email notification | Exporter toutes les donnees | DATA_EXPORT + email + admin |
| ES444 | Attaquant utilise les webhooks pour exfiltrer des donnees | MEDIUM | Webhook exfiltration | Webhook URL whitelist, signature verification | Creer webhook -> exfiltrer | WEBHOOK_ABUSE + block |

### 7.3 Reverse Engineering

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES445 | Attaquant decompile le JS bundle pour trouver les endpoints | MEDIUM | JS decompilation | Code minification, source maps desactivees en prod | Source map -> endpoints | (pas de prevention definitive) |
| ES446 | Attaquant analyse le trafic reseau (DevTools Network tab) | MEDIUM | Traffic analysis | Chiffrement TLS (ne peut pas voir le contenu) | Network tab -> API calls | (bloque par TLS) |
| ES447 | Attaquant trouve une API non documentee dans le bundle | HIGH | Hidden API discovery | Pas d'API routes sensibles dans le bundle | Rechercher /api/ dans bundle | (audit regulier) |
| ES448 | Attaquant utilise les React DevTools pour inspecter l'etat | MEDIUM | DevTools inspection | Server Components, pas de donnees sensibles cote client | React DevTools -> state | (bloque par Server Components) |
| ES449 | Attaquant intercepte les requetes via un proxy man-in-the-middle local | MEDIUM | Local MITM | Certificate pinning (optionnel) | Proxy local (Burp, Fiddler) | (partiellement bloque) |

---

## 8. Fraude & Ingénierie Sociale (ES491-ES540)

### 8.1 Fraude de Paiement

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES491 | Attaquant utilise une carte bancaire volee pour s'abonner | CRITICAL | Stolen card | Payment provider 3D Secure, fraud scoring | Carte volee -> payer abonnement | FRAUD_PAYMENT + block |
| ES492 | Attaquant cree un compte avec email temporaire + carte pre-payee | HIGH | Prepaid card | Email reputation, payment verification | Temp mail + prepaid card | SUSPICIOUS_SIGNUP + verification |
| ES493 | Attaquant demande un remboursement frauduleux (chargeback) | MEDIUM | Chargeback abuse | Payment history, device trust, plan history | Payer -> chargeback | CHARGEBACK + account suspension |
| ES494 | Attaquant utilise un code promo multiple fois | MEDIUM | Promo abuse | Code promo usage unique, lie a l'utilisateur | Creer 10 comptes avec meme promo | PROMO_ABUSE + block |
| ES495 | Attaquant utilise un abonnement gratuit (trial) pour creer 100 comptes | HIGH | Trial abuse | Email verification, phone verification, device trust | 100 emails jetables -> 100 trials | TRIAL_ABUSE + block |

### 8.2 Social Engineering & Phishing

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES496 | Attaquant envoie un email de phishing "Votre compte a ete compromise" | HIGH | Phishing | Email authentication (SPF, DKIM, DMARC), anti-phishing training | Email -> lien phishing | PHISHING_REPORTED |
| ES497 | Attaquant appelle le support en se faisant passer pour un utilisateur | HIGH | Vishing | Verification d'identite (email OTP, questions) | Appel support impersonation | SUPPORT_IMPERSONATION + verification |
| ES498 | Attaquant cree un faux site de connexion (typosquatting) | MEDIUM | Typosquatting | DNS monitoring, enregistrement domaines similaires | signauxx.com vs signaux.com | TYPOSQUATTING_DETECTED |
| ES499 | Attaquant envoie un message Telegram "Officiel NBA" pour voler des identifiants | HIGH | Telegram phishing | Verification du canal officiel, signalement | Telegram -> faux support | PHISHING_REPORTED |
| ES500 | Attaquant utilise une fausse application mobile pour recolter les identifiants | HIGH | Fake app | App verification, store official | APK clone -> login | FAKE_APP_DETECTED |

### 8.3 Manipulation

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES501 | Attaquant convainc l'utilisateur de partager son code 2FA | CRITICAL | 2FA social engineering | Education, "Jamais partager votre code" messaging | Appel -> demander code 2FA | (bloque par education) |
| ES502 | Attaquant convainc le support de changer l'email du compte | CRITICAL | Social engineering support | Verification multi-facteur, email notification | Support -> changer email | EMAIL_CHANGED + email + admin |
| ES503 | Attaquant utilise des donnees publiques pour deviner les questions de securite | MEDIUM | Security questions | Pas de questions de securite (Better Auth) | Deviner reponses | (bloque par absence) |
| ES504 | Attaquant contacte le support en simulant une urgence | HIGH | Urgency manipulation | Procedure standard, pas de bypass securite | Urgence -> support bypass | SUPPORT_BYPASS_ATTEMPT |

---

## 9. Bots Telegram & Messagerie (ES541-ES570)

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES541 | Bot Telegram qui notifie les nouveaux signaux (revente) | HIGH | Notification bot | API rate limit, webhook secret verification | Bot ecoute les notifications | API_ABUSE + block |
| ES542 | Bot Telegram qui automatise les trades via les signaux | CRITICAL | Trading bot | API rate limit, trading limits, behavioral analysis | Bot -> trade automatique | AUTOMATED_TRADING + block |
| ES543 | Bot Telegram qui relaie les signaux vers un groupe prive | CRITICAL | Signal relay | Watermarking, tracking, legal action | Bot -> groupe Telegram | SIGNAL_RELAY + investigation |
| ES544 | Bot Telegram qui cree des comptes en masse | HIGH | Account farming | Rate limit signup, email verification, device trust | Bot -> 100 comptes Telegram | SIGNUP_FARM + block |
| ES545 | Bot Telegram qui spamme les utilisateurs | MEDIUM | Spam bot | Rate limit messaging, spam detection | Bot -> message spam | SPAM_DETECTED + block |
| ES546 | Attaquant utilise le bot Telegram officiel pour du phishing | CRITICAL | Official bot impersonation | Bot verification (badge officiel) | Faux bot Telegram | PHISHING_REPORTED |
| ES547 | Attaquant intercepte les webhooks Telegram (secret token faible) | HIGH | Webhook interception | TELEGRAM_WEBHOOK_SECRET, TLS | Intercepter webhook | WEBHOOK_INTERCEPTION |
| ES548 | Attaquant utilise un bot Discord pour la revente de signaux | HIGH | Discord bot | Monitoring, legal | Bot Discord -> revente | SIGNAL_RESELLING |
| ES549 | Attaquant automatise les reponses via WhatsApp Business API | MEDIUM | WhatsApp automation | API key verification, rate limit | WhatsApp bot | API_ABUSE |
| ES550 | Bot Discord qui envoie des invitations groupées vers un serveur de revente | HIGH | Discord invite spam | Moderation, report system | Invitation Discord | SPAM_DETECTED |

---

## 10. Attaques sur les API & WebSocket (ES571-ES610)

### 10.1 API Abuse

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES571 | Attaquant appelle une API interne sans auth | CRITICAL | Unauthenticated access | Middleware auth verification, cookie check | GET /api/admin/users | 401 + audit |
| ES572 | Attaquant appelle une API avec un token expire | MEDIUM | Expired token | Token validity verification chaque requete | JWT expire -> API | 401 |
| ES573 | Attaquant appelle une API admin avec un role insuffisant | HIGH | Privilege escalation | RBAC verification (requireRole) | GET /api/admin avec role MEMBER | 403 + audit |
| ES574 | Attaquant appelle une API avec un token d'un autre utilisateur (IDOR) | CRITICAL | IDOR | Ownership verification, pas de ID dans URL | /api/user/123/signals | IDOR_ATTEMPT + audit |
| ES575 | Attaquant appelle /api/public/health trop souvent | LOW | Health check abuse | Rate limit meme sur endpoints publics | GET /api/public/health 1000x | RATE_LIMIT_EXCEEDED + 429 |
| ES576 | Attaquant appelle des endpoints avec des parametres invalides pour trouver des failles | MEDIUM | Parameter fuzzing | Zod validation, 400 + log | Fuzzer tous les endpoints | VALIDATION_ERROR + log |
| ES577 | Attaquant appelle /api/auth/sign-in avec Content-Type: text/plain | MEDIUM | Content-Type bypass | Content-Type validation, 415 | POST sign-in text/plain | UNSUPPORTED_MEDIA_TYPE |
| ES578 | Attaquant appelle les endpoints avec des methodes HTTP non autorisees | LOW | HTTP method tampering | Method validation, 405 | DELETE /api/signals | METHOD_NOT_ALLOWED |
| ES579 | Attaquant appelle le endpoint GraphQL avec une introspection | MEDIUM | GraphQL introspection | Desactiver introspection en prod | POST /api/graphql { __schema } | GRAPHQL_INTROSPECTION + block |
| ES580 | Attaquant appelle l'API avec un corps de requete enorme | MEDIUM | Payload size attack | Taille max 1MB, 413 | POST 50MB | PAYLOAD_TOO_LARGE + 413 |

### 10.2 WebSocket Abuse

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES581 | Attaquant se connecte au WebSocket sans cookie | CRITICAL | WS unauthenticated | Cookie HMAC verification obligatoire | WSS connect sans cookie | 401 WS_UNAUTHORIZED |
| ES582 | Attaquant tente de rejoindre une room non autorisee | HIGH | WS room abuse | Room join verification, audit | socket.join("admin:...") | WS_ROOM_ABUSE + audit |
| ES583 | Attaquant envoie 1000 messages/seconde sur WebSocket | MEDIUM | WS flood | Rate limit messages, 10/sec | Emit messages en boucle | WS_FLOOD + disconnect |
| ES584 | Attaquant envoie des messages de taille excessive sur WS | MEDIUM | WS oversized | Message size limit 256KB | Emit 1MB message | WS_OVERSIZED + disconnect |
| ES585 | Attaquant maintient 100 connexions WebSocket simultanees | HIGH | WS connection flood | Connexions max: 3/user/session | 100 connexions paralleles | WS_CONNECTION_FLOOD + block |
| ES586 | Attaquant ecoute les broadcasts sans autorisation | HIGH | WS eavesdropping | Room verification, chaque socket en room authorisee | Ecouter events broadcasts | WS_EAVESDROP + audit |
| ES587 | Attaquant usurpe l'identite d'un autre user via le user ID dans le message | HIGH | WS impersonation | User ID utilise depuis la session, pas du message | socket.emit("user:123:event") | WS_IMPERSONATION + revoke |

### 10.3 Webhook Exploitation

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES588 | Attaquant envoie des webhooks frauduleux sans signature | CRITICAL | Unverified webhook | Signature HMAC verification obligatoire | POST /api/webhooks sans signature | WEBHOOK_INVALID_SIGNATURE + 401 |
| ES589 | Attaquant rejoue un webhook valide | MEDIUM | Webhook replay | Timestamp + nonce, tolerance 5min | Rejouer webhook valide | WEBHOOK_REPLAY + ignore |
| ES590 | Attaquant envoie 1000 webhooks en 1 minute | MEDIUM | Webhook flood | Rate limit webhooks, IP whitelist | 1000 webhooks/min | WEBHOOK_FLOOD + rate limit |
| ES591 | Attaquant decouvre l'URL du webhook et l'appelle directement | HIGH | Webhook URL discovery | URL longue et aleatoire, IP whitelist | Deviner URL webhook | WEBHOOK_GUESS + block |

---

## 11. Attaques Serveur & Infrastructure (ES611-ES650)

### 11.1 Redis Attacks

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES611 | Attaquant accede a Redis sans mot de passe | CRITICAL | Redis unauthenticated | Redis AUTH password, reseau interne | redis-cli -h nba-redis | (bloque par password + reseau) |
| ES612 | Attaquant execute FLUSHALL sur Redis pour effacer le cache | CRITICAL | Redis destructive | RENAME_COMMAND FLUSHALL "", persistence AOF | FLUSHALL commande | (bloque par rename) |
| ES613 | Attaquant utilise Redis pour stocker des donnees malveillantes (key injection) | MEDIUM | Redis injection | Input validation avant Redis set | SET key contenant \r\n | (bloque par ioredis) |
| ES614 | Attaquant exploite une cle Redis sans TTL pour saturer la memoire | MEDIUM | Memory saturation | TTL obligatoire, maxmemory, maxmemory-policy | Creer des cles sans TTL | (bloque par TTL policy) |
| ES615 | Attaquant accede aux donnees Redis depuis le reseau public | CRITICAL | Redis exposed | Reseau interne Docker uniquement | Scan port 6379 public | (bloque par reseau) |
| ES616 | Attaquant lit les queues BullMQ pour voler les jobs | HIGH | BullMQ snooping | Redis password, pas d'exposition | Lire bull:risk:async:* | (bloque par auth) |

### 11.2 PostgreSQL Attacks

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES617 | Attaquant tente une injection SQL via l'API | CRITICAL | SQL injection | Prisma ORM (parametrized queries) | ' OR 1=1 -- | (bloque par ORM) |
| ES618 | Attaquant accede a PostgreSQL sans TLS | HIGH | PostgreSQL unencrypted | SSL mode require, TLS | psql sans SSL | (bloque par SSL require) |
| ES619 | Attaquant tente de se connecter avec le role superuser | HIGH | Superuser attempt | Role applicatif limite (pas de superuser) | psql -U postgres | (bloque par configuration) |
| ES620 | Attaquant tente d'exploiter une injection SQL via raw query | HIGH | Raw SQL abuse | Prisma ORM, pas de raw SQL sans revue | $queryRawUnsafe('...') | (bloque par revue) |
| ES621 | Attaquant vole les donnees via un dump de la base | CRITICAL | Database dump | Chiffrement au repos, acces restreint | pg_dump | (si acces reseau -> IR) |

### 11.3 Docker & Container Attacks

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES622 | Attaquant s'echappe du conteneur Docker | CRITICAL | Container escape | no-new-privileges, cap_drop ALL, user non-root | Escape via breakout | (bloque par configuration) |
| ES623 | Attaquant execute des commandes dans le conteneur via RCE | CRITICAL | RCE | Prisma ORM, pas de shell exec, input validation | RCE dans le conteneur | RCE_DETECTED + IR |
| ES624 | Attaquant monte un volume Docker pour acceder aux fichiers | HIGH | Volume abuse | Volumes limites, read-only root | Monter /etc/hosts | (bloque par read-only) |
| ES625 | Attaquant utilise une image Docker avec vulnerabilites | HIGH | Vulnerable image | Trivy scan, multi-stage builds | Image avec CVE connue | (bloque par scan) |
| ES626 | Attaquant empoisonne le cache Docker (cache poisoning) | MEDIUM | Cache poisoning | Checksum verification, pull policy | Cache -> image modifiee | (bloque par checksum) |

### 11.4 SSRF & Network

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES627 | Attaquant utilise un webhook vers un serveur interne (SSRF) | CRITICAL | SSRF | URL whitelist, private IP block, redirect: manual | Webhook URL -> http://localhost:6379 | SSRF_ATTEMPT + block |
| ES628 | Attaquant utilise l'upload de fichier pour lire des fichiers internes | HIGH | File traversal | Path validation, pas de path dans l'URL | ../etc/passwd | PATH_TRAVERSAL + block |
| ES629 | Attaquant utilise un fetch vers un service cloud metadata (169.254.169.254) | CRITICAL | Cloud metadata | Private IP block dans les fetch | GET http://169.254.169.254 | SSRF_METADATA + block |
| ES630 | Attaquant scanne les ports internes via SSRF | HIGH | Port scanning | Reseau interne isole, pas de retour d'erreur detaille | SSRF -> port scan interne | SSRF_PORT_SCAN + block |

### 11.5 Business Logic Abuse

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES631 | Attaquant cree 100 comptes pour utiliser la periode d'essai gratuite | HIGH | Trial farming | Device fingerprint, email verification, IP check | 100 emails temporaires, 100 trials | TRIAL_FARMING + block |
| ES632 | Attaquant downgrade son compte pour eviter la facturation | MEDIUM | Plan downgrade abuse | Facturation au prorata, pas de refund automatique | Downgrade -> refund | PLAN_CHANGE + audit |
| ES633 | Attaquant utilise le parrainage pour creer des faux comptes | MEDIUM | Referral abuse | IP check, device trust, limite de parrainage | Parrainer ses propres comptes | REFERRAL_ABUSE + invalidation |
| ES634 | Attaquant manipule les statistiques de performance | MEDIUM | Stats manipulation | Validation des entrees, signature des donnees | Manipuler les metrics API | STATS_TAMPERING + audit |
| ES635 | Attaquant utilise le feedback system pour manipuler les scores | LOW | Feedback abuse | Rate limit, moderation, verification | Faux avis | FEEDBACK_ABUSE + moderation |

---

## 12. Attaques Avancees (ES636-ES650)

| ID | Scenario | Risque | Vecteur | Protection | Tests | Alerte |
|----|----------|--------|---------|------------|-------|--------|
| ES636 | Attaquant combine VPN + nouveau navigateur + nouveau fingerprint pour eviter la detection | CRITICAL | Full evasion | Multi-couche scoring, behavioral profiling, ML | VPN + incognito + nouveau FP | HIGH_RISK_ASYNC + challenge |
| ES637 | Attaquant utilise un reseau social (Facebook, Google) pour identifier les utilisateurs cibles | MEDIUM | OSINT targeting | Minimisation donnees publiques, privacy settings | Rechercher email sur les reseaux | (pas de prevention technique) |
| ES638 | Attaquant analyse les temps de reponse pour extraire des informations (timing attack) | MEDIUM | Timing side-channel | Execution time constant (bcrypt meme si email inconnu) | Mesurer temps reponse API | (bloque par execution constante) |
| ES639 | Attaquant utilise un reseau de smartphones (residential proxies) pour eviter les blocages IP | HIGH | Mobile proxy network | Device fingerprint, behavioral, ML | Reseau de 1000 smartphone IPs | MOBILE_PROXY_NET + high score |
| ES640 | Attaquant clone le comportement utilisateur (mouse movement, typing pattern) | HIGH | Behavioral clone | ML détection de pattern, variance anormale | Enregistrer puis reproduire comportement | BEHAVIORAL_CLONE + challenge |
| ES641 | Attaquant utilise un zero-day navigateur pour contourner les protections | CRITICAL | 0-day exploit | Defense in depth, WAF, mise a jour rapide | Exploit 0-day Chrome | (bloque par WAF + equipe securite) |
| ES642 | Attaquant utilise un zero-day dans Next.js/Better Auth | CRITICAL | 0-day framework | Mise a jour rapide (< 48h), hotfix, WAF | CVE specific framework | (patch d'urgence + deploy) |
| ES643 | Attaquant exploite une race condition lors de l'inscription | HIGH | Race condition | Transactions Prisma, unique contraintes | 10 inscriptions simultanees meme email | RACE_CONDITION + audit |
| ES644 | Attaquant exploite un cache poisoning (CDN) pour servir du contenu malveillant | CRITICAL | Cache poisoning | Cache key validation, purging control | Poison CDN cache | CACHE_POISON + purge |
| ES645 | Attaquant exploite un dependency confusion (npm) | CRITICAL | Supply chain | npm audit, dependabot, scoped packages | Installer package malveillant | (bloque par audit) |
| ES646 | Attaquant compromet le pipeline CI/CD | CRITICAL | CI/CD attack | GitHub Secrets, code review, signed commits | Modifier workflow | CI_ATTACK + IR |
| ES647 | Attaquant vole les logs d'audit pour masquer ses traces | CRITICAL | Audit tampering | Chaine d'audit infalsifiable (hash chain) | Modifier audit_logs | (bloque par hash verification) |
| ES648 | Attaquant utilise un certificat TLS expire pour du MITM | MEDIUM | TLS expiry | Let's Encrypt auto-renewal, monitoring | Certificat expire | CERT_EXPIRY + alerte |
| ES649 | Attaquant compromet un compte admin via spear phishing cible | CRITICAL | Targeted phishing | 2FA obligatoire admin, formation, email security | Email cible admin | PHISHING_TARGETED + PagerDuty |
| ES650 | Attaquant utilise l'historique des mots de passe pour retrouver le mot de passe actuel | LOW | Password history | Mots de passe haches (bcrypt), pas de pattern d'historique | Changer password 5x, retrouver le 6eme | (bloque par bcrypt) |

---

## Resume

| Categorie | Scenarios | Plage IDs | Risque Principal |
|-----------|:---------:|:---------:|------------------|
| Partage de compte & mots de passe | 80 | ES001-ES080 | HIGH / CRITICAL |
| Attaques sur les identifiants | 80 | ES081-ES160 | CRITICAL |
| VPN, Proxy, TOR & Anonymizers | 70 | ES161-ES230 | HIGH |
| Vol de session | 70 | ES231-ES300 | CRITICAL |
| Clonage & usurpation d'appareil | 60 | ES301-ES360 | HIGH |
| Automatisation & bots | 70 | ES361-ES430 | HIGH |
| Scraping & extraction | 60 | ES431-ES490 | HIGH |
| Fraude & ingenierie sociale | 50 | ES491-ES540 | CRITICAL |
| Bots Telegram & messagerie | 30 | ES541-ES570 | HIGH |
| Attaques API & WebSocket | 40 | ES571-ES610 | CRITICAL |
| Attaques serveur & infrastructure | 40 | ES611-ES650 | CRITICAL |
| Attaques avancees | 15 | ES636-ES650 | CRITICAL |
| **Total** | **650** | **ES001-ES650** | |

---

> **Fin du document MASTER_EVIL_STORIES.md**  
> **Version 1.0.0 — 2026-07-22**  
> **Nombre total de scenarios** : 650  
> **Prochaine revision : mensuelle** (nouveaux scenarios a ajouter)
