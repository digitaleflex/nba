#!/usr/bin/env python3
"""Ferme les issues en doublon et ajoute des commentaires de cross-reference."""

import subprocess
import sys
import time

REPO = "digitaleflex/nba"

# ── DOUBLONS À FERMER ──
# (old_issue, survivor_issue, reason)
CLOSES: list[tuple[int, int, str]] = [
    # --- UI-P0/P1 duplicates ---
    (230, 270, "Skeleton loading → couvert par #270 'Skeletons animés sur toutes les pages critiques' (M4)"),
    (231, 271, "Empty states standardisés → couvert par #271 'Empty States contextualisés pour toutes les listes' (M4)"),
    (225, 264, "Breadcrumb navigation → couvert par #264 'Breadcrumbs systématiques dans le AppShell' (M2)"),
    (224, 263, "Réorganiser les onglets admin → couvert par #263 'Admin — refonte en Hub & Spoke' (M2)"),
    (228, 262, "Styles de boutons standardisés → englobé par #262 'Système de profondeur' (M1) et design system global"),
    # --- UI-P3 accessibility duplicates ---
    (245, 284, "Taille texte + contraste WCAG AA → couvert par #284 'Audit complet contraste AA/AAA + corrections' (M8)"),
    (244, 286, "aria-live zones dynamiques → couvert par #286 'Attributs ARIA systématiques' (M8)"),
    (243, 286, "Alt text images → couvert par #286 'Attributs ARIA systématiques' (M8)"),
    (238, 286, "ARIA labels tableaux/boutons → couvert par #286 'Attributs ARIA systématiques' (M8)"),
    (239, 285, "Focus visible éléments → couvert par #285 'Navigation clavier complète + Skip-to-content' (M8)"),
    (240, 285, "Raccourcis clavier Command Palette → couvert par #285 'Navigation clavier complète' (M8)"),
    # --- UX-Apple duplicates ---
    (247, 262, "Architecture spatiale Glass morphism+profondeur → couvert par #262 'Système de profondeur — refonte échelle d'ombres' (M1)"),
    (250, 288, "Feedback émotionnel — Ressentir l'action → couvert par #288 'Haptique feedback sur mobile' (M9)"),
    (253, 292, "Confiance par transparence — Montrer le pourquoi → couvert par #292 'Mise en avant sécurité comme avantage marketing' (M9)"),
    # --- Audit NBA (plan de refactoring) duplicates ---
    (133, 271, "MT6: Amélioration états vides → couvert par #271 'Empty States contextualisés' (M4)"),
    (134, 284, "MT7: Accessibilité WCAG 2.2 Phase 1 → couvert par #284, #285, #286 (M8 Accessibilité)"),
    (129, 281, "MT1: Système de niveaux XP+déblocages → couvert par #281 'Gamification Hall of Fame + Badges persistants' (M7)"),
    # --- Audit Center long terme ---
    (81, 276, "LT5 — Sélection multiple et actions groupées → couvert par #276 'Admin — actions batch sur les listes' (M6)"),
    # --- Resilience ---
    (147, 290, "Service worker avec page offline → couvert par #290 'Service Worker — cache offline + fallback réseau' (M9)"),
    # --- Navigation mobile déjà existante ---
    (242, 0, "Bottom navigation bar mobile → couvert par l'issue existante 'Navigation mobile — réduire de 9 à 5 items + menu Plus' — déjà créée avant l'audit"),
]

# ── LIENS CROISÉS (partial overlap, keep both) ──
# (issue_a, issue_b, cross_ref_note)
LINKS: list[tuple[int, int, str]] = [
    (232, 265, "#232 (Feedback visuel actions) ↔ #265 (Validation inline onBlur) — le feedback visuel inclut la validation inline mais aussi les confirmations d'action. Complémentaires."),
    (232, 277, "#232 (Feedback visuel actions) ↔ #277 (Undo Toast admin) — le undo toast est un type spécifique de feedback visuel."),
    (252, 287, "#252 (Mouvement significatif) ↔ #287 (Transitions de page fluides) — le mouvement significatif est le principe, les transitions de page sont l'implémentation."),
    (246, 259, "#246 (Le Pulse — Système vivant) ↔ #259 (Refonte page login animation) — le Pulse est le concept global, la page login est une application concrète."),
    (246, 280, "#246 (Le Pulse — Système vivant) ↔ #280 (Preuve sociale compteurs live) — les compteurs live contribuent au sentiment de 'système vivant'."),
    (128, 273, "#128 (EPIC Onboarding & UX intelligent) ↔ #273 (Flux onboarding unifié) — #273 est l'implémentation concrète d'une partie de l'EPIC #128."),
    (131, 282, "#131 (Coach IA LLM) ↔ #282 (Insights IA hebdo) — le Coach IA est plus ambitieux (LLM interactif), les insights hebdo sont une première étape automatique."),
    (186, 265, "#186 (Unifier messages d'erreur inline) ↔ #265 (Validation inline onBlur) — l'unification des messages d'erreur doit informer le design de la validation inline."),
    (251, 130, "#251 (Progression graduelle) ↔ #130 (Apprentissage progressif MT3) — même principe : révéler les features progressivement."),
    (256, 291, "#256 (Notifications subtiles) ↔ #291 (Son des notifications configurable) — les notifications subtiles sont le principe UX, le son configurable est une feature concrète."),
    (249, 282, "#249 (Suggestions intelligentes) ↔ #282 (Insights IA hebdo) — les suggestions intelligentes englobent les insights + suggestions proactives."),
    (223, 277, "#223 (Remplacer confirm() par AlertDialog) ↔ #277 (Undo Toast) — les deux améliorent l'UX des actions destructives."),
    (227, 262, "#227 (SeverityBadge unifié) ↔ #262 (Système de profondeur + design system) — à coordonner dans la refonte du design system."),
    (226, 276, "#226 (Composant DataTable réutilisable) ↔ #276 (Actions batch admin) — la DataTable est le prérequis pour les checkboxes de sélection batch."),
    (154, 273, "#154 (Autosave formulaires sessionStorage) ↔ #273 (Onboarding avec sauvegarde auto) — l'autosave sessionStorage est la brique technique pour la sauvegarde d'onboarding."),
]


def gh_comment(issue: int, body: str) -> bool:
    r = subprocess.run(
        ["gh", "issue", "comment", str(issue), "--repo", REPO, "--body", body],
        capture_output=True, text=True, timeout=15,
    )
    if r.returncode != 0:
        print(f"  ❌ Comment #{issue}: {r.stderr.strip()}")
        return False
    print(f"  💬 Commentaire ajouté sur #{issue}")
    return True


def gh_close(issue: int, reason: str) -> bool:
    r = subprocess.run(
        ["gh", "issue", "close", str(issue), "--repo", REPO, "--reason", "not planned"],
        capture_output=True, text=True, timeout=15,
    )
    if r.returncode != 0:
        print(f"  ❌ Close #{issue}: {r.stderr.strip()}")
        return False
    print(f"  🔒 Fermé #{issue}")
    return True


def main():
    print("\n🔍 Analyse des doublons — Nettoyage du backlog\n")

    # ── Étape 1 : Fermer les doublons ──
    print("── Étape 1/2 : Fermeture des doublons\n")
    closed = 0
    for old, survivor, reason in CLOSES:
        survivor_ref = f"Voir #{survivor}" if survivor > 0 else ""
        comment = (
            f"## 🔄 Fusionné\n\n"
            f"Cette issue est désormais couverte de manière plus détaillée par une issue de l'audit UX Apple Design.\n\n"
            f"**{reason}**\n\n"
            f"{survivor_ref}"
        )
        if gh_comment(old, comment):
            time.sleep(1)
            if gh_close(old, reason):
                closed += 1
        time.sleep(0.5)

    print(f"\n  → {closed} doublons fermés\n")

    # ── Étape 2 : Ajouter les liens croisés ──
    print("── Étape 2/2 : Liens croisés (partial overlaps)\n")
    linked = 0
    for issue_a, issue_b, note in LINKS:
        comment = (
            f"## 🔗 Lien croisé\n\n"
            f"Cette issue est liée à #{issue_b}.\n\n"
            f"{note}\n\n"
            f"Les deux issues restent ouvertes — elles sont complémentaires et non redondantes."
        )
        # Comment on both
        if gh_comment(issue_a, comment):
            linked += 1
        time.sleep(0.8)
        if gh_comment(issue_b, comment.replace(f"#{issue_b}", f"#{issue_a}")):
            linked += 1
        time.sleep(0.5)

    print(f"\n  → {linked} commentaires de lien ajoutés")
    print("\n✅ Nettoyage terminé !")


if __name__ == "__main__":
    main()
