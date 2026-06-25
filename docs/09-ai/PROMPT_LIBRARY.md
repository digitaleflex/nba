# Prompt Library

> **Version:** 1.0

## Available Prompts

| Prompt | File | Usage |
|--------|------|-------|
| Create Module | `.prompts/create-module.md` | Create a new business module |
| Create Page | `.prompts/create-page.md` | Create a new page |
| Code Review | `.prompts/review-code.md` | Review pull request |
| Fix Bug | `.prompts/fix-bug.md` | Debug and fix an issue |

## Usage

```bash
# Load a prompt
cat .prompts/create-module.md

# Use with context
cat .prompts/create-module.md | pnpm prompt
```
