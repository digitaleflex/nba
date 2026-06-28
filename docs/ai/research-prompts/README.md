# Research Prompts Library

> **Version:** 1.0  
> **Status:** Approved

---

## Purpose

This library contains **Research Prompts** for AI agents working on NBA.

Unlike traditional prompts that ask AI to "generate stories", these prompts instruct AI to:
1. **Audit** existing documentation
2. **Analyze** gaps, inconsistencies, and missing pieces
3. **Detect** what's already covered
4. **Produce** only what's necessary for V1

---

## Usage

Before using any research prompt, **ALWAYS** read:

1. `MASTER_RESEARCH_PROMPT.md` - Fundamental audit rule
2. The specific research prompt for your task
3. All source documentation referenced in the prompt

---

## Available Prompts

| Prompt | Purpose | Output Location |
|--------|---------|-----------------|
| `MASTER_RESEARCH_PROMPT.md` | Fundamental audit methodology | - |
| `ADMIN_STORIES.md` | Research admin operations for V1 | `docs/quality/ADMIN_STORIES.md` |
| `SYSTEM_STORIES.md` | Research system behaviors | `docs/quality/SYSTEM_STORIES.md` |
| `BUSINESS_STORIES.md` | Research and validate business rules | `docs/quality/BUSINESS_STORIES.md` |
| `EDGE_CASES.md` | Research edge cases and failure scenarios | `docs/quality/EDGE_CASES.md` |
| `EVIL_USER_STORIES.md` | Research security attack vectors | `docs/quality/EVIL_USER_STORIES.md` |
| `CHAOS_TESTS.md` | Research infrastructure failure scenarios | `docs/quality/CHAOS_TESTS.md` |
| `SECURITY_TEST_CASES.md` | Research security test procedures | `docs/quality/SECURITY_TEST_CASES.md` |
| `ACCEPTANCE_CRITERIA.md` | Research testable acceptance criteria | `docs/quality/ACCEPTANCE_CRITERIA.md` |
| `QA_CHECKLIST.md` | Research production validation checklist | `docs/quality/QA_CHECKLIST.md` |

---

## Core Principles

### 1. Audit First
Never generate content without first auditing existing documentation.

### 2. No Duplication
If a feature or rule is already documented, do not recreate it.

### 3. V1 Scope Only
Only produce content relevant to Version 1. Flag anything outside scope.

### 4. Business Justification
Every item must be justified by PRODUCT_VISION.md, FUNCTIONAL_SPECIFICATION.md, or BUSINESS_RULES.md.

### 5. Testable Output
Everything produced must be objectively verifiable.