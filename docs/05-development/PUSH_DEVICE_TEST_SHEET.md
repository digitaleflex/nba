# Fiche de test des alertes sur appareils réels

> À remplir **sur de vrais téléphones**. Un navigateur sans interface ne peut pas accorder la permission de notification : aucun test automatique ne remplace cette fiche.
> Objectif : savoir, chiffres à l'appui, si un signal publié **s'affiche et s'entend** écran verrouillé.

## 0. Avant de commencer

- [ ] Version déployée notée : `________` (Service worker ≥ 2.7.0 : ouvrez `https://<site>/sw.js`, la deuxième ligne donne `SW_VERSION`).
- [ ] Un **compte membre de test** actif, rattaché à un **plan ou une audience de test** qui ne contient personne d'autre. **Ne publiez jamais un signal de test sur un plan réel** : tous ses membres le recevraient.
- [ ] Les clés VAPID sont configurées en production (sinon l'écran n'affiche aucune activation).
- [ ] Appareils disponibles : iPhone (iOS 16.4 ou plus), Android (Chrome), ordinateur (Chrome ou Edge).

## 1. Activation (un tableau par appareil)

Dans l'application : Notifications › « Activer les alertes ».

| Appareil | Modèle / version | Guide iPhone affiché si non installé ? | Permission demandée au clic ? | « Alertes actives » ? | Test reçu (« Reçue ✅ ») ? |
|---|---|---|---|---|---|
| iPhone (Safari, non installé) | | ☐ attendu : oui | — | — | — |
| iPhone (application installée) | | — | ☐ | ☐ | ☐ |
| Android Chrome | | — | ☐ | ☐ | ☐ |
| Ordinateur | | — | ☐ | ☐ | ☐ |

## 2. Alerte de test, écran verrouillé

Bouton « Envoyer une alerte de test », puis verrouillez l'écran **avant** de cliquer (ou attendez 10 s).

| Appareil | Notification visible écran verrouillé | Son / vibration | Délai (s) | Clic ouvre `/dashboard/notifications` |
|---|---|---|---|---|
| iPhone installé | ☐ | ☐ | | ☐ |
| Android | ☐ | ☐ | | ☐ |
| Ordinateur | ☐ | ☐ | | ☐ |

## 3. Vrai signal (audience de test uniquement)

Publiez un signal depuis l'espace admin vers le plan de test, notez l'heure `T0`.

| Appareil | État de l'appareil | Heure de réception | Délai | Texte correct (1re ligne du signal) | Clic ouvre le signal |
|---|---|---|---|---|---|
| iPhone | écran verrouillé | | | ☐ | ☐ |
| iPhone | application ouverte | | | ☐ (une seule alerte attendue : notification système, pas de doublon grave) | ☐ |
| iPhone | mode Concentration actif, NBA **non** autorisée | | | attendu : rien (limite connue) | — |
| iPhone | mode Concentration actif, NBA autorisée | | | ☐ | ☐ |
| Android | écran verrouillé | | | ☐ | ☐ |
| Android | économiseur de batterie actif | | | ☐ | ☐ |
| Android | application ouverte | | | ☐ (un seul son, celui choisi, pas de notification en double) | ☐ |
| Ordinateur | onglet masqué | | | ☐ | ☐ |

## 4. Cas à risque

- [ ] **Sans activité depuis 24 h** (téléphone au repos toute la nuit) : un signal arrive-t-il le matin, et dans quel délai ?
- [ ] **Mode avion 5 min** puis retour réseau pendant la durée de vie de l'alerte (15 min) : l'alerte arrive-t-elle ? (Au-delà de 15 min elle est volontairement abandonnée.)
- [ ] **Badge de l'icône** (application installée) : un point/chiffre apparaît à la réception, disparaît à l'ouverture.
- [ ] **Heures de silence** réglées sur la plage actuelle, case « signaux » décochée : le signal arrive-t-il quand même ? Puis cochée : est-il bien retenu ?
- [ ] **Réabonnement** : désinstaller puis réinstaller l'application, se reconnecter : « Alertes actives » revient-il après « Réparer » ?

## 5. Lecture des résultats

| Constat | Cause probable | Action |
|---|---|---|
| Rien reçu, permission accordée | abonnement perdu, ou service push injoignable | « Réparer » ; vérifier `/api/push/status` |
| Reçu seulement app ouverte | Android : batterie « optimisée » / iPhone : pas installée | guide « réglages du téléphone » |
| Reçu mais sans son | commutateur silencieux, catégorie sans son, mode Concentration | guide « réglages du téléphone » |
| Délai > 1 min | téléphone en économie d'énergie | noter le modèle, régler la batterie |
| Jamais reçu sur un iPhone précis | application non installée sur l'écran d'accueil, ou iOS < 16.4 | guide iPhone |

## 6. Décision

Comptez, sur au moins **5 signaux réels** par appareil, combien arrivent **écran verrouillé en moins de 30 s** :

| Appareil | Signaux envoyés | Reçus en < 30 s | Taux |
|---|---|---|---|
| iPhone | | | |
| Android | | | |

- Taux ≥ 90 % partout : la PWA suffit, pas d'application native.
- Taux < 90 % sur une plateforme **après** application des réglages du guide : l'application native devient justifiée (voir #369).

Merci de coller le tableau rempli en commentaire de l'issue **#363**.
