"""Orchestrateur du monitoring.

Exécute l'ensemble des vérifications (délivrabilité email Resend + distribution des
notifications) et produit un rapport combiné. Sort avec un code non-zéro si une
vérification échoue (utilisable dans un cron / CI).

Usage:
    python scripts/monitor/run_all.py [--days 7]
"""
import sys
import os
import argparse

import common
import check_deliverability
import check_notifications


def run_check(name: str, fn):
    print("=" * 60)
    print(f"  {name}")
    print("=" * 60)
    try:
        return fn()
    except SystemExit as e:
        return int(e.code or 0)
    except Exception as e:  # noqa: BLE001
        print(f"  [ERREUR] {name}: {e}")
        return 2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()

    for var in ("DATABASE_URL", "RESEND_API_KEY"):
        if not os.environ.get(var):
            sys.exit(f"[run_all] Variable manquante: {var}")

    code = 0
    code |= run_check("1) Délivrabilité email (Resend)", lambda: check_deliverability.main())
    code |= run_check("2) Distribution des notifications", lambda: check_notifications.main())

    print("\n" + "=" * 60)
    if code == 0:
        print("RAPPORT: tout est OK.")
    else:
        print(f"RAPPORT: des problèmes ont été détectés (code={code}).")
    print("=" * 60)
    return code


if __name__ == "__main__":
    sys.exit(main())
