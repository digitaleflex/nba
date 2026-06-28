# Chaos Tests

## CHAOS-001 : Redis - Arrêt du service Redis
**Composant** : Redis
**Scénario** : Le conteneur Redis est arrêté ou indisponible (crash, OOM, partition réseau).
**Impact utilisateur** : L'interface principale reste accessible. Les notifications sont retardées. Le rate limiting est désactivé temporairement.
**Impact système** : BullMQ ne peut plus enfiler ni consommer les jobs. Les workers tentent une reconnexion automatique. Les jobs en cours sont perdus (pas de persistance native garantie).
**Dégradation** : Oui - le site fonctionne en mode dégradé sans traitements asynchrones. Les actions critiques (auth, dashboard) restent opérationnelles via PostgreSQL.
**Référence** : ADR-006, ADR-007

## CHAOS-002 : Redis - Latence excessive (> 5 secondes)
**Composant** : Redis
**Scénario** : Le réseau entre l'application et Redis est dégradé ou Redis subit une latence P99 > 5s.
**Impact utilisateur** : Temps de réponse des pages augmentés. Les opérations de rate limiting deviennent erratiques.
**Impact système** : Timeouts Prisma/Redis sur les verrous distribués et le cache. Risque de cascade sur les requêtes HTTP.
**Dégradation** : Oui - le cache est désactivé, les requêtes tombent directement sur PostgreSQL. Le système reste fonctionnel mais sous performance.
**Référence** : ADR-006

## CHAOS-003 : Redis - Mémoire saturée
**Composant** : Redis
**Scénario** : Redis atteint sa limite de mémoire (maxmemory) et rejette les nouvelles écritures (OOM).
**Impact utilisateur** : Les jobs BullMQ sont refusés. Les nouvelles sessions/cache sont perdus.
**Impact système** : BullMQ retourne des erreurs lors de l'enfilement. Les workers ne peuvent pas récupérer de jobs.
**Dégradation** : Oui - seules les lectures PostgreSQL restent possibles. Les traitements asynchrones sont bloqués jusqu'à libération mémoire.
**Référence** : ADR-006

## CHAOS-004 : Neon PostgreSQL - Indisponibilité temporaire
**Composant** : Neon
**Scénario** : Neon PostgreSQL est indisponible (maintenance, incident réseau, région down).
**Impact utilisateur** : Page d'erreur 503 propre affichée. Aucune donnée ne peut être lue ou écrite.
**Impact système** : Toutes les requêtes Prisma échouent. Les connexions sont perdues. Le pool de connexions doit être drainé.
**Dégradation** : Non - PostgreSQL est la source de vérité unique (ADR-005). Sans DB, le système ne peut pas servir de contenu métier.
**Référence** : ADR-005

## CHAOS-005 : Neon PostgreSQL - Latence P99 élevée
**Composant** : Neon
**Scénario** : Le temps de réponse de Neon augmente drastiquement (P99 > 2s) sans être totalement down.
**Impact utilisateur** : Le dashboard dépasse la cible de 2s. Les Server Actions timeout.
**Impact système** : Prisma attends les réponses DB. BullMQ workers peuvent être bloqués sur les sauvegardes de job.
**Dégradation** : Partielle - les lectures simples continuent mais les écritures sont ralenties. Risque de timeout sur les opérations complexes.
**Référence** : ADR-005

## CHAOS-006 : Neon PostgreSQL - Dépassement du pool de connexions
**Composant** : Neon
**Scénario** : Le pool de connexions Prisma atteint sa limite (too many connections) suite à un spike de trafic ou à des connexions non libérées.
**Impact utilisateur** : Certaines requêtes retournent une erreur 503. L'application ne peut plus traiter de nouvelles demandes.
**Impact système** : Prisma rejette les nouvelles connexions. Les workers et l'app se partagent le pool épuisé.
**Dégradation** : Non - c'est une coupure de service jusqu'à libération des connexions (kill idle, restart workers).
**Référence** : ADR-005, ADR-015

## CHAOS-007 : BullMQ - Crash du Worker
**Composant** : BullMQ
**Scénario** : Le processus nba-worker crash (OOM, exception non catchée, signal kill).
**Impact utilisateur** : Les signaux publiés ne sont pas distribués. Les emails de notification sont retardés.
**Impact système** : Les jobs restent dans la queue Redis (si Redis est up). Au redémarrage, le worker reprend les jobs non acquittés. Pas de perte de jobs si les locks sont bien gérés.
**Dégradation** : Oui - le site fonctionne, seuls les traitements différés sont en attente.
**Référence** : ADR-007, ADR-020

## CHAOS-008 : BullMQ - Saturation de la queue (backpressure)
**Composant** : BullMQ
**Scénario** : Un pic massif de jobs (ex: 10k signaux publiés d'un coup) sature la queue Redis et les workers.
**Impact utilisateur** : Les notifications sont fortement retardées. La latence de publication des signaux augmente.
**Impact système** : La queue Redis atteint sa limite mémoire. Les nouveaux jobs sont refusés ou retardés. Le système d'alerte doit détecter la backlog.
**Dégradation** : Oui - les jobs critiques sont priorités. Les jobs non urgents sont retardés.
**Référence** : ADR-007

## CHAOS-009 : BullMQ - Échec permanent d'un job après retries
**Composant** : BullMQ
**Scénario** : Un job spécifique échoue systématiquement après tous les retries (ex: email invalide, ID signal corrompu).
**Impact utilisateur** : Le signal est publié en base mais la notification correspondante n'est jamais délivrée.
**Impact système** : Le job est déplacé dans la dead-letter queue (DLQ). Il doit générer une alerte. Le worker continue de traiter les autres jobs.
**Dégradation** : Oui - seul le job concerné est bloqué. Le reste du système fonctionne. Intervention humaine requise pour la DLQ.
**Référence** : ADR-007, ADR-020

## CHAOS-010 : Docker - Crash du conteneur nba-app
**Composant** : Docker
**Scénario** : Le conteneur Next.js crash (segfault, OOM kill, exception fatale).
**Impact utilisateur** : L'application devient inaccessible (502/503 selon Nginx). Les utilisateurs voient une page d'erreur Nginx.
**Impact système** : Docker Compose doit redémarrer le conteneur selon la policy (restart: unless-stopped). La recovery time dépend du healthcheck.
**Dégradation** : Non - coupure totale jusqu'au redémarrage du conteneur.
**Référence** : ADR-008

## CHAOS-011 : Docker - Crash du conteneur nba-worker
**Composant** : Docker
**Scénario** : Le conteneur worker BullMQ crash et ne redémarre pas (mauvais healthcheck, boucle infinie au démarrage).
**Impact utilisateur** : Aucun impact immédiat visible. Les traitements asynchrones s'accumulent progressivement.
**Impact système** : La queue Redis grossit. Les emails et distributions de signaux sont retardés de plusieurs heures.
**Dégradation** : Oui - l'application web fonctionne, seuls les workers sont arrêtés. Alerte requise.
**Référence** : ADR-008, ADR-007

## CHAOS-012 : Docker - Espace disque saturé sur l'hôte
**Composant** : Docker
**Scénario** : Le disque de l'hôte VPS atteint 100% (logs Docker, volumes, uploads temporaires).
**Impact utilisateur** : Les uploads KYC échouent. Les conteneurs ne peuvent plus écrire de logs. Les nouveaux conteneurs ne démarrent pas.
**Impact système** : Prisma ne peut plus écrire de migrations ou de fichiers. Les workers peuvent crash sur write. PostgreSQL reste opérationnel (externe).
**Dégradation** : Partielle - les opérations en lecture seule fonctionnent. Les écritures (upload, logs, KYC) sont bloquées.
**Référence** : ADR-008, ADR-022

## CHAOS-013 : Resend - API indisponible (5xx)
**Composant** : Resend
**Scénario** : L'API Resend retourne des erreurs 5xx (maintenance, incident).
**Impact utilisateur** : Les emails transactionnels ne sont pas délivrés (vérification email, reset password, KYC).
**Impact système** : Les workers Resend retournent des erreurs. BullMQ replanifie les jobs selon la stratégie de retry. Les jobs échoués sont loggués.
**Dégradation** : Oui - les emails sont retardés. Les parcours utilisateur critiques (reset password) doivent avoir un fallback (retry manuel ou support).
**Référence** : ADR-023

## CHAOS-014 : Resend - Rate limiting (429 Too Many Requests)
**Composant** : Resend
**Scénario** : Resend limite le volume d'envois (429). Le burst dépasse les quotas du plan.
**Impact utilisateur** : Certains emails sont retardés ou non délivrés temporairement.
**Impact système** : Les workers doivent respecter un backoff avant retry. La queue BullMQ s'allonge.
**Dégradation** : Oui - les envois sont throttlés. Les emails urgents (sécurité) doivent être priorisés devant les notifications standard.
**Référence** : ADR-023

## CHAOS-015 : Resend - Latence réseau élevée
**Composant** : Resend
**Scénario** : Le réseau entre l'infrastructure et Resend est dégradé (DNS slow, routing congesté).
**Impact utilisateur** : Temps de traitement des workers augmenté. Pas d'impact direct visible sur l'interface.
**Impact système** : Les workers timeout sur les appels Resend. Les jobs sont retentés. Risque de timeout des containers si pas de timeout configuré.
**Dégradation** : Oui - les envois sont retardés. Le système doit avoir un timeout strict (ex: 10s) pour ne pas bloquer le worker.
**Référence** : ADR-023

## CHAOS-016 : Cloudflare - Panne CDN / Proxy
**Composant** : Cloudflare
**Scénario** : Cloudflare est indisponible ou refuse le trafic (incident Cloudflare, mauvaise config DNS).
**Impact utilisateur** : Le site devient inaccessible ou extrêmement lent (si le VPS peut répondre directement). Pas de cache edge, pas de DDoS protection.
**Impact système** : Si le VPS n'est pas exposé directement (ADR-010), c'est une coupure totale. Si un bypass existe, le trafic arrive directement sans SSL ni WAF.
**Dégradation** : Non - coupure totale si le VPS n'est pas directement routable. Si un plan B existe, dégradation du cache et de la sécurité.
**Référence** : ADR-010

## CHAOS-017 : Cloudflare - Faux positif WAF / blocage légitime
**Composant** : Cloudflare
**Scénario** : Une règle WAF Cloudflare bloque du trafic légitime (faux positif sur un pattern SQL, bot flags sur un admin).
**Impact utilisateur** : L'utilisateur reçoit une erreur 403 (ou 1010) sans explication. Impossible de se connecter ou d'envoyer un formulaire.
**Impact système** : Les logs Cloudflare montrent le blocage. L'application ne voit jamais la requête.
**Dégradation** : Non - c'est un blocage dur. La résolution passe par la modification des règles Cloudflare ou le bypass IP temporaire.
**Référence** : ADR-010

## CHAOS-018 : Nginx - Service arrêté
**Composant** : Nginx
**Scénario** : Le processus Nginx est arrêté (crash, kill, config invalide au reload).
**Impact utilisateur** : L'application devient inaccessible (connection refused ou timeout).
**Impact système** : Les conteneurs Docker restent up mais ne reçoivent plus de trafic HTTP. SSL/TLS n'est plus servi.
**Dégradation** : Non - coupure totale du reverse proxy. Le VPS ne doit pas être exposé directement (ADR-010), donc pas de fallback utilisateur.
**Référence** : ADR-008, ADR-010

## CHAOS-019 : Nginx - Mauvaise configuration upstream (502 Bad Gateway)
**Composant** : Nginx
**Scénario** : Nginx est up mais incapable de joindre l'upstream (mauvais port, container down, healthcheck KO).
**Impact utilisateur** : Erreur 502 Bad Gateway sur toutes les pages.
**Impact système** : Nginx loggue les erreurs upstream. Les conteneurs app/worker sont peut-être down ou sur un port différent.
**Dégradation** : Non - erreur HTTP 500 jusqu'à correction de la config upstream ou redémarrage des dépendances.
**Référence** : ADR-008

## CHAOS-020 : Nginx - Saturation des connexions (slowloris / DoS partiel)
**Composant** : Nginx
**Scénario** : Nginx est saturé par des connexions lentes (slowloris) ou un DDoS absorbé partiellement par Cloudflare.
**Impact utilisateur** : Les nouvelles connexions sont refusées (503) ou timeout. Les utilisateurs voient la page charger indéfiniment.
**Impact système** : Nginx atteint worker_connections. Les workers sont occupés par des connexions zombies. Les vrais utilisateurs sont impactés.
**Dégradation** : Partielle - si Cloudflare absorbe le DDoS, Nginx reste utilisable. Sinon, saturation totale jusqu'à blocage IP ou scaling.
**Référence** : ADR-008, ADR-010
