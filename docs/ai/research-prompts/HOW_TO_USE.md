# HOW TO USE RESEARCH PROMPTS

## Workflow d'Injection des Prompts

### Étape 1: Lire le Master Prompt

```bash
# Toujours lire en premier
head -20 docs/ai/research-prompts/MASTER_RESEARCH_PROMPT.md
```

### Étape 2: Choisir le Prompt Selon la Tâche

| Tâche Développeur | Prompt à Utiliser |
|-------------------|-------------------|
| "Ajouter un bouton" | ADMIN_STORIES.md |
| "Modifier le flow" | BUSINESS_STORIES.md |
| "Sécuriser endpoint" | EVIL_USER_STORIES.md + SECURITY_TEST_CASES.md |
| "Gérer timeout" | EDGE_CASES.md |
| "Tester crash" | CHAOS_TESTS.md |
| "Valider feature" | ACCEPTANCE_CRITERIA.md |
| "Release production" | QA_CHECKLIST.md |

### Étape 3: Audit Pré-Action

```bash
# Exemple : Ajouter feature notifications
grep -i "notification" docs/quality/ADMIN_STORIES.md
grep -i "notification" docs/quality/BUSINESS_STORIES.md
grep -i "telegram" docs/quality/SECURITY_TEST_CASES.md
grep -i "notification" docs/quality/EVIL_USER_STORIES.md
```

### Étape 4: Template d'Injection

```markdown
## Prompt Injection Template

Avant de [ACTION], lire et appliquer :

1. docs/ai/research-prompts/MASTER_RESEARCH_PROMPT.md
2. docs/ai/research-prompts/[PROMPT_SELECTED].md
3. Cross-reference avec docs/quality/[RELATED].md

Vérifier :
- Pas de duplication avec [DOC_EXISTING].md
- Justification métier dans BUSINESS_RULES.md
- Critère d'acceptation dans ACCEPTANCE_CRITERIA.md
- Sécurité dans SECURITY_TEST_CASES.md
```

---

## Exemples d'Injection

### Cas 1: Nouvelle Feature

```text
Prompt : ADMIN_STORIES.md
Contexte : Ajout bouton "Export CSV" dans /admin/members

Process :
1. Lire ADMIN_STORIES.md lines 1-50
2. Vérifier si "export" existe déjà → NON
3. Vérifier BUSINESS_RULES.md admin section → OK
4. Créer ADM-xxx avec dépendances
5. Ajouter critère Gherkin dans ACCEPTANCE_CRITERIA.md
```

### Cas 2: Sécuriser Endpoint

```text
Prompt : EVIL_USER_STORIES.md
Contexte : POST /api/admin/signals/publish

Process :
1. Lire EVIL-010, EVIL-013 (signals attacks)
2. Vérifier SECURITY_TEST_CASES.md RBAC section
3. Ajouter test SEC-API-020 si manquant
4. Implémenter requirePermission check
```