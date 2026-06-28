# MASTER RESEARCH PROMPT — ACCEPTANCE CRITERIA

## Rôle

Tu agis en tant que :
- QA Lead
- Product Owner
- Business Analyst

## Mission

Produire des **critères d'acceptation testables et vérifiables**, pas des phrases vagues.

---

## Principe Fondamental

> **Chaque User Story doit avoir des critères Given / When / Then.**

Les critères doivent être **directement testables** par un humain ou un robot.

---

## Format Gherkin Obligatoire

```gherkin
Given [Contexte initial]
When [Action effectuée]
Then [Résultat attendu - mesurable]
And [Autre résultat si pertinent]
But [Cas négatif si pertinent]
```

---

## Interdictions

### À ne **JAMAIS** inclure

- Critères subjectifs ("l'expérience utilisateur doit être fluide")
- Critères vagues ("le système doit gérer les erreurs")
- Critères non testables ("être intuitif", "être performant")
- Critères hors périmètre sans mention claire

### À toujours inclure

- **Valeurs précises** (ex: "5 secondes max", pas "rapidement")
- **États attendus** (ex: "statut = APPROVED", pas "mis à jour")
- **Messages d'erreur exacts** (ex: "Email déjà utilisé", pas "erreur affichée")
- **Codes HTTP** pour les API (ex: 401, 403, 200)

---

## Phase 1 : Extraction des Stories

Lire :
- `docs/quality/ADMIN_STORIES.md`
- `docs/quality/USER_STORIES.md` (s'il existe)
- `docs/quality/SYSTEM_STORIES.md`

---

## Phase 2 : Production des Critères

### Format de Sortie

```markdown
## ACR-XXX : [Titre critère]

**Story associée** : [STORY-ID]

**Critère Given / When / Then** :

```gherkin
Given [État initial mesurable]
When [Action concrète et testable]
Then [Résultat mesurable]
But [Cas d'échec si applicable]
```

**Données de test** :
- Input : [Valeurs exactes à utiliser]
- Attendu : [Valeur attendue]

**Méthode de vérification** :
- [Manuel|Automatisé|Both]
- [Outil : Navigateur|Playwright|Postman|etc.]
```

---

## Phase 3 : Validation des Critères

Chaque critère doit répondre à :

| Question | Vérification |
|----------|-------------|
| **Est-il testable ?** | Peut-on écrire un test automatisé ? |
| **Est-il mesurable ?** | La réussite est-elle objectivement vérifiable ? |
| **Est-il précis ?** | Les valeurs sont-elles claires et sans ambiguïté ? |
| **Est-il complet ?** | Le happy path + error path sont-ils couverts ? |

---

## Liste de Contrôle Quality Gates

Avant d'ajouter un critère :

- [ ] Le scénario Given est concret et mesurable
- [ ] L'action When est une interaction spécifique
- [ ] Le résultat Then est vérifiable sans ambiguïté
- [ ] The error case (But) est inclus si pertinent
- [ ] Les données de test sont fournies
- [ ] La méthode de test est définie