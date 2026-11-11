# Glossaire, voix et ton

> **Décision actée (11 nov. 2026) : vouvoiement partout côté membre.** L'espace admin suit la même règle.
> Un seul nom par fonctionnalité : **le libellé du menu = le titre de la page = le titre mobile = le fil d'Ariane**.

## 1. Voix et ton

| Règle | Exemple |
|---|---|
| Phrases : **vous**, jamais **tu** | « Votre journal est vide. » |
| Boutons et descriptions d'action : **infinitif** | « Enregistrer une entrée », « Noter votre état d'esprit » |
| Impératif seulement au **vous** | « Essayez d'autres termes de recherche. » |
| Messages d'erreur : ce qui s'est passé + ce qu'il faut faire | « Impossible de charger vos statistiques. Réessayez dans un instant. » |
| Pas de jargon technique ni d'identifiant brut | « Paiement en attente », pas `PAYMENT_PENDING` |
| Accents obligatoires, y compris en majuscules | « ÉVÉNEMENTS », pas « EVENEMENTS » |
| Pas d'anglicisme quand un mot français existe | « Risque (%) », pas « Risk (%) » |

### Réécritures à appliquer (chaînes réelles au 11 nov. 2026)

| Fichier | Avant | Après |
|---|---|---|
| `dashboard/journal/components/trade-list.tsx:116` | Essaie d'autres termes de recherche. / Enregistre ton premier trade… | Essayez d'autres termes de recherche. / Enregistrez votre premier trade… |
| `dashboard/journal/components/stats-dashboard.tsx:73` | Impossible de charger tes statistiques. | Impossible de charger vos statistiques. |
| `dashboard/journal/components/reflections-tab.tsx:54` | Donne une note à ta journée | Donnez une note à votre journée |
| `…/reflections-tab.tsx:130` | Qu'as-tu appris aujourd'hui ? Qu'est-ce qui s'est bien/mal passé ? | Qu'avez-vous appris aujourd'hui ? Qu'est-ce qui s'est bien ou mal passé ? |
| `…/reflections-tab.tsx:170` | Prends 2 minutes chaque jour pour noter ton état d'esprit… | Prenez 2 minutes chaque jour pour noter votre état d'esprit… |
| `dashboard/page.tsx:85-86` | Enregistre une entrée / Note ton état d'esprit | Enregistrer une entrée / Noter votre état d'esprit |
| `dashboard/journal/page.tsx:197` | Suis tes trades, analyse ta performance, maîtrise tes émotions | Suivez vos trades, analysez votre performance, maîtrisez vos émotions |
| `dashboard/support/page.tsx:78` | Décris ton problème ou ta question… | Décrivez votre problème ou votre question… |
| `dashboard/redpills/components/redpills-view.tsx:183,196` | Tu es à jour. Reviens demain… / Reviens bientôt. | Vous êtes à jour. Revenez demain… / Revenez bientôt. |
| `dashboard/messages/page.tsx:522-523` | Contacte le support… / ta recherche | Contactez le support… / votre recherche |
| `dashboard/signals/tracking/page.tsx:119` | jours où tu as tradé | jours où vous avez tradé |
| `components/guides/*.tsx` (4 fichiers) | Clique ici…, ton premier trade, ton winrate… | Cliquez ici…, votre premier trade, votre taux de réussite… |
| `lib/coach/patterns.ts:71,97,109` | Tu n'as pas défini… / Tu étais anxieux… / Tu étais très confiant… | Vous n'avez pas défini… / Vous étiez anxieux… / Vous étiez très confiant… |

> Les chaînes complètes sont dans les fichiers : la liste ci-dessus donne le point d'entrée, pas le texte intégral. Avant de réécrire `lib/coach/patterns.ts` et les guides, **vérifiez les tests** qui comparent ces textes.

## 2. Vocabulaire (un seul nom par fonctionnalité)

| Fonctionnalité | Nom retenu | À éliminer | État |
|---|---|---|---|
| Accueil membre | **Tableau de bord** | « Tableau » (bottom-nav) | recommandé |
| Flux de signaux | **Signaux** | « Mes Signaux » (menu) | recommandé |
| Contenu d'Emerson | **Redpills d'Emerson** (menu et page) ; l'élément du jour = **Pilule du jour** | « Pilule du jour » comme titre de page, « Redpills — Pilule du jour » | recommandé |
| Contrôle d'identité et broker | **Vérification** | « Onboarding », « Centre de vérification » | recommandé |
| Offre souscrite | **Abonnement** | « Offre », « Mon abonnement » | recommandé |
| Suivi des trades | **Journal** | — | acté |
| Aide | **Support** | — | acté |
| Admin : journaux des membres | **Journaux des membres** | « Coaching » (menu) / « Journaux de trading » (page) | recommandé |
| Admin : Membres vs Utilisateurs | **à trancher** (voir la carte, décision D-2) | | décision en attente |

*Acté* = décidé par le propriétaire ; *recommandé* = proposition de l'audit, à valider à la première PR qui la met en œuvre.

## 3. Où ça se code

- Libellés de navigation : `src/config/navigation.ts` (source unique pour la sidebar, la bottom-nav, le menu et les titres mobiles).
- Titres de page et métadonnées : chaque `page.tsx` (`metadata.title`) doit reprendre le libellé du menu.
- Statuts et rôles : `src/lib/labels.ts` (à créer, issue UX-11).
