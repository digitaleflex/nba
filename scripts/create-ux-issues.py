#!/usr/bin/env python3
"""
Script de création des milestones et issues UX sur GitHub.
Lit les définitions depuis .github/ux-audit-issues.yml et les pousse
via l'API GitHub (gh CLI).

Usage:
  ./scripts/create-ux-issues.sh          # Mode réel
  ./scripts/create-ux-issues.sh --dry-run  # Simulation (log uniquement)

Pré-requis:
  - gh CLI installé et authentifié (gh auth status)
  - Python 3.8+ avec PyYAML
"""

import sys
import os
import subprocess
import json
import argparse
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
YAML_FILE = REPO_ROOT / ".github" / "ux-audit-issues.yml"
REPO = "digitaleflex/nba"

# ── Couleurs terminal ──────────────────────────────────────────────────
C = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[91m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "blue": "\033[94m",
    "cyan": "\033[96m",
}


def log(section: str, msg: str, emoji: str = "•") -> None:
    print(f" {C['cyan']}{emoji}{C['reset']} {C['bold']}{section}{C['reset']} {msg}")


def success(msg: str) -> None:
    print(f" {C['green']}✓{C['reset']} {msg}")


def error(msg: str) -> None:
    print(f" {C['red']}✗{C['reset']} {msg}")


def warn(msg: str) -> None:
    print(f" {C['yellow']}⚠{C['reset']} {msg}")


def gh(*args: str, check: bool = True, capture: bool = True) -> subprocess.CompletedProcess:
    """Wrapper autour de gh CLI."""
    cmd = ["gh", "api"] + list(args)
    result = subprocess.run(
        cmd,
        capture_output=capture,
        text=True,
        timeout=30,
    )
    if check and result.returncode != 0:
        print(f"  {C['red']}gh error:{C['reset']} {result.stderr.strip()}")
    return result


# ── Parsing YAML basique (sans PyYAML, pour éviter la dépendance) ─────

import re


def parse_yaml_simple(filepath: Path) -> dict:
    """Parse très basique du YAML pour notre structure spécifique."""
    with open(filepath) as f:
        content = f.read()

    data = {"milestones": [], "issues": []}

    # Milestones via patterns
    ms_pattern = re.findall(
        r"-\s+id:\s*(\S+)\s*\n\s+title:\s*\"(.+?)\"\s*\n\s+description:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s+due_on:|\s+- id:)",
        content,
        re.MULTILINE,
    )

    # Extraire manuellement
    milestone_blocks = re.split(r"\n  - id: m", content)
    for block in milestone_blocks:
        if not block.strip():
            continue
        block = "m" + block if not block.startswith("m") else block

        ms_id = re.search(r"^(\S+)", block)
        ms_title = re.search(r'title:\s*"(.+?)"', block)
        ms_desc_match = re.search(r"description:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s+due_on:)", block)
        ms_due = re.search(r"due_on:\s*\"(.+?)\"", block)

        if ms_id and ms_title:
            desc = ""
            if ms_desc_match:
                desc_lines = ms_desc_match.group(1).strip().split("\n")
                desc = "\n".join(line.strip() for line in desc_lines)
            data["milestones"].append({
                "id": ms_id.group(1),
                "title": ms_title.group(1),
                "description": desc,
                "due_on": ms_due.group(1) if ms_due else "",
            })

    # Issues via patterns
    issue_blocks = re.split(r"\n  - title:", content)
    for block in issue_blocks[1:]:  # skip pre-first-issue content
        block = "title:" + block

        title = re.search(r'title:\s*"(.+?)"', block)
        milestone = re.search(r"milestone:\s*(\S+)", block)
        labels_raw = re.search(r"labels:\s*\[(.+?)\]", block)
        labels = []
        if labels_raw:
            labels = [l.strip().strip("\"'") for l in labels_raw.group(1).split(",")]

        problem = re.search(r"problem:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s{4}solution:)", block)
        solution = re.search(r"solution:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s{4}implementation:)", block)
        implementation = re.search(r"implementation:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s{4}neuroRationale:)", block)
        neuro = re.search(r"neuroRationale:\s*\|\s*\n((?:\s{4,}.+\n?)+?)(?=\s{4}acceptanceCriteria:)", block)
        ac_raw = re.search(r"acceptanceCriteria:\s*\n((?:\s{4,}-.+\n?)+?)(?=\s{4}effort:)", block)
        effort = re.search(r"effort:\s*(\S+)", block)
        priority = re.search(r"priority:\s*(\d+)", block)

        # Sub-issues
        sub_issues = []
        sub_match = re.search(r"subIssues:\s*\n((?:\s{4,}-.+\n?)+?)(?=\s{4}\w+:|\Z)", block)
        if sub_match:
            for line in sub_match.group(1).strip().split("\n"):
                cleaned = line.strip().lstrip("-").strip().strip('"')
                if cleaned:
                    sub_issues.append(cleaned)

        def dedent(text: str) -> str:
            lines = text.strip().split("\n")
            if not lines:
                return ""
            min_indent = min(len(line) - len(line.lstrip()) for line in lines if line.strip())
            return "\n".join(line[min_indent:] for line in lines)

        acc_criteria = []
        if ac_raw:
            for line in ac_raw.group(1).strip().split("\n"):
                cleaned = line.strip().lstrip("-").strip()
                if cleaned:
                    acc_criteria.append(cleaned)

        if title:
            data["issues"].append({
                "title": title.group(1),
                "milestone": milestone.group(1) if milestone else "",
                "labels": labels,
                "problem": dedent(problem.group(1)) if problem else "",
                "solution": dedent(solution.group(1)) if solution else "",
                "implementation": dedent(implementation.group(1)) if implementation else "",
                "neuroRationale": dedent(neuro.group(1)) if neuro else "",
                "acceptanceCriteria": acc_criteria,
                "effort": effort.group(1) if effort else "M",
                "priority": int(priority.group(1)) if priority else 5,
                "subIssues": sub_issues,
            })

    return data


def build_issue_body(issue: dict) -> str:
    """Construit le markdown du body d'une issue."""
    parts = []

    parts.append("## Problème UX")
    parts.append(issue["problem"])
    parts.append("")

    parts.append("## Solution proposée")
    parts.append(issue["solution"])
    parts.append("")

    parts.append("## Détails d'implémentation")
    parts.append(issue["implementation"])
    parts.append("")

    if issue["acceptanceCriteria"]:
        parts.append("## Critères d'acceptation")
        for ac in issue["acceptanceCriteria"]:
            parts.append(f"- {ac}")
        parts.append("")

    parts.append("## Justification Neuro-Marketing")
    parts.append(issue["neuroRationale"])
    parts.append("")

    if issue["subIssues"]:
        parts.append("## Sous-tâches")
        for i, sub in enumerate(issue["subIssues"], 1):
            parts.append(f"- [ ] {sub}")
        parts.append("")

    parts.append("---")
    parts.append(f"**Effort estimé** : `{issue['effort']}` | **Priorité** : `{issue['priority']}/10`")

    return "\n".join(parts)


def create_labels(data: dict, dry_run: bool) -> None:
    """Crée tous les labels nécessaires."""
    # Collecter tous les labels uniques
    all_labels = set()
    for issue in data["issues"]:
        for label in issue["labels"]:
            all_labels.add(label)

    # Récupérer les labels existants
    result = gh(f"repos/{REPO}/labels?per_page=100", check=False)
    existing = set()
    if result.returncode == 0:
        try:
            for lb in json.loads(result.stdout):
                existing.add(lb["name"])
        except json.JSONDecodeError:
            pass

    colors = {
        "ux": "7057ff",
        "login": "0e8a16",
        "visual": "d4c5f9",
        "brand": "fbca04",
        "design-system": "006b75",
        "dark-mode": "2c0716",
        "mobile": "b60205",
        "navigation": "1d76db",
        "admin": "d93f0b",
        "desktop": "0e8a16",
        "forms": "c5def5",
        "validation": "5319e7",
        "forms": "c5def5",
        "onboarding": "bfdadc",
        "security": "b60205",
        "loading": "e99695",
        "performance": "e99695",
        "empty-state": "fef2c0",
        "error-state": "b60205",
        "dashboard": "1d76db",
        "safari": "0052cc",
        "real-time": "006b75",
        "batch": "d93f0b",
        "undo": "0e8a16",
        "alerts": "b60205",
        "neuromarketing": "fbca04",
        "retention": "0e8a16",
        "gamification": "7057ff",
        "ai": "006b75",
        "journal": "1d76db",
        "conversion": "0e8a16",
        "accessibility": "c2e0c6",
        "a11y": "c2e0c6",
        "keyboard": "c2e0c6",
        "aria": "c2e0c6",
        "animation": "d4c5f9",
        "polish": "d4c5f9",
        "haptic": "b60205",
        "delight": "fbca04",
        "pwa": "1d76db",
        "offline": "5319e7",
        "notifications": "006b75",
        "settings": "006b75",
        "trust": "0e8a16",
        "marketing": "fbca04",
        "ios": "0052cc",
    }

    to_create = all_labels - existing
    if not to_create:
        log("LABELS", "Tous les labels existent déjà", "✅")
        return

    for label in sorted(to_create):
        color = colors.get(label, "ededed")
        if dry_run:
            log("LABEL", f"[DRY-RUN] Créerait: {label} (#{color})", "🏷️")
            continue

        r = subprocess.run(
            [
                "gh", "api", f"repos/{REPO}/labels",
                "--method", "POST",
                "--field", f"name={label}",
                "--field", f"color={color}",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if r.returncode == 0:
            log("LABEL", f"{label} — créé", "🏷️")
        else:
            warn(f"Label {label}: {r.stderr.strip()}")


def create_milestones(data: dict, dry_run: bool) -> dict:
    """Crée les milestones et retourne la map id→number."""
    milestone_map = {}

    # Récupérer les milestones existants
    result = gh(f"repos/{REPO}/milestones?state=all&per_page=100", check=False)
    existing = {}
    if result.returncode == 0:
        try:
            for ms in json.loads(result.stdout):
                existing[ms["title"]] = ms["number"]
        except json.JSONDecodeError:
            warn("Impossible de parser les milestones existants")

    for ms in data["milestones"]:
        if ms["title"] in existing:
            milestone_map[ms["id"]] = existing[ms["title"]]
            log("MILESTONE", f"{ms['title']} (existe déjà, #{existing[ms['title']]})", "♻️")
            continue

        if dry_run:
            log("MILESTONE", f"[DRY-RUN] Créerait: {ms['title']} (due: {ms.get('due_on', 'N/A')})", "📋")
            milestone_map[ms["id"]] = 0
            continue

        desc_clean = ms["description"][:1500]
        fields = [
            "gh", "api", f"repos/{REPO}/milestones",
            "--method", "POST",
            "--field", f"title={ms['title']}",
            "--field", f"description={desc_clean}",
        ]
        if ms["due_on"]:
            fields += ["--field", f"due_on={ms['due_on']}T23:59:59Z"]

        r = subprocess.run(fields, capture_output=True, text=True, timeout=15)

        if r.returncode == 0:
            try:
                data_resp = json.loads(r.stdout)
                number = data_resp["number"]
                milestone_map[ms["id"]] = number
                log("MILESTONE", f"{ms['title']} → #{number}", "✅")
            except (json.JSONDecodeError, KeyError):
                warn(f"Milestone créé mais impossible d'extraire le numéro: {r.stdout[:100]}")
        else:
            error(f"Échec création milestone {ms['title']}: {r.stderr.strip()}")

    return milestone_map


def create_issues(data: dict, milestone_map: dict, dry_run: bool) -> None:
    """Crée toutes les issues avec leurs labels et milestones."""
    total = len(data["issues"])
    created = 0
    skipped = 0

    # Construire une map inverse: milestone_id → milestone_title
    ms_title_map = {ms["id"]: ms["title"] for ms in data["milestones"]}

    for i, issue in enumerate(data["issues"], 1):
        ms_title = ms_title_map.get(issue["milestone"], "")
        labels = ",".join(issue["labels"])
        body = build_issue_body(issue)

        if dry_run:
            log("ISSUE", f"[{i}/{total}] {issue['title']} → milestone:{issue['milestone']} labels:{labels}", "📝")
            continue

        # Vérifier si l'issue existe déjà (même titre)
        check = subprocess.run(
            [
                "gh", "issue", "list",
                "--repo", REPO,
                "--search", issue["title"],
                "--state", "all",
                "--limit", "1",
                "--json", "number,title",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if check.returncode == 0:
            try:
                existing_issues = json.loads(check.stdout)
                if existing_issues:
                    log("ISSUE", f"[{i}/{total}] {issue['title']} (existe déjà, skip)", "♻️")
                    skipped += 1
                    continue
            except json.JSONDecodeError:
                pass

        # Créer l'issue (--milestone attend le TITRE du milestone, pas le numéro)
        cmd = [
            "gh", "issue", "create",
            "--repo", REPO,
            "--title", issue["title"],
            "--body", body,
            "--label", labels,
        ]
        if ms_title:
            cmd += ["--milestone", ms_title]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=15,
        )

        if result.returncode == 0:
            url = result.stdout.strip()
            log("ISSUE", f"[{i}/{total}] {issue['title']} → {url}", "✅")
            created += 1
        else:
            error(f"[{i}/{total}] {issue['title']}: {result.stderr.strip()}")

    print(f"\n {C['bold']}Résumé :{C['reset']} {created} issues créées, {skipped} ignorées, {total} total")


def main():
    parser = argparse.ArgumentParser(description="Crée les milestones et issues UX sur GitHub")
    parser.add_argument("--dry-run", action="store_true", help="Simulation sans écriture")
    args = parser.parse_args()

    print(f"\n{C['bold']}{C['blue']}╔══════════════════════════════════════════════════════╗{C['reset']}")
    print(f"{C['bold']}{C['blue']}║{C['reset']}   NBA UX Audit — GitHub Issue Creator              {C['bold']}{C['blue']}║{C['reset']}")
    print(f"{C['bold']}{C['blue']}╚══════════════════════════════════════════════════════╝{C['reset']}")
    print(f"   Repo : {C['cyan']}{REPO}{C['reset']}")
    print(f"   Mode : {C['yellow'] if args.dry_run else C['green']}{'DRY-RUN (simulation)' if args.dry_run else 'PRODUCTION'}{C['reset']}")
    print()

    if not YAML_FILE.exists():
        error(f"Fichier YAML introuvable : {YAML_FILE}")
        sys.exit(1)

    log("LOAD", f"Parsing {YAML_FILE.name}...", "📖")
    data = parse_yaml_simple(YAML_FILE)

    print(f"   → {len(data['milestones'])} milestones, {len(data['issues'])} issues trouvées")
    print()

    # ── Étape 0 : Créer les labels ──
    print(f" {C['bold']}── Étape 0/3 : Création des labels{C['reset']}")
    print()
    create_labels(data, args.dry_run)
    print()

    # ── Étape 1 : Créer les milestones ──
    print(f" {C['bold']}── Étape 1/3 : Création des milestones{C['reset']}")
    print()
    milestone_map = create_milestones(data, args.dry_run)
    print()

    # ── Étape 2 : Créer les issues ──
    print(f" {C['bold']}── Étape 2/3 : Création des issues{C['reset']}")
    print()
    create_issues(data, milestone_map, args.dry_run)

    print()
    success("Terminé !")
    print()


if __name__ == "__main__":
    main()
