"""Vérifie que la distribution des signaux a bien créé les notifications + livraisons email.

Pour chaque signal publié récent, compare le nombre de destinataires ATTENDUS
(membres actifs, non supprimés, avec accès APPROUVÉ aux plans ciblés, hors expéditeur)
avec le nombre de notifications SIGNALS et de livraisons email réellement créées.

Usage:
    python scripts/monitor/check_notifications.py [--days 7]
"""
import sys
import argparse
from collections import defaultdict

import common


def fetch_published_signals(conn, days: int, limit: int = 50):
    sql = """
        SELECT s.id AS signal_id, s.created_by,
               array_agg(DISTINCT sa.plan_id) AS plan_ids
        FROM signals s
        JOIN signal_audience sa ON sa.signal_id = s.id
        WHERE s.status = 'PUBLISHED'
          AND s.deleted_at IS NULL
          AND s.published_at >= NOW() - (%s::int || ' days')::interval
        GROUP BY s.id, s.created_by
        ORDER BY s.published_at DESC
        LIMIT %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (days, limit))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def expected_recipients(conn, signal: dict) -> int:
    sql = """
        SELECT count(*) FROM users
        WHERE is_active
          AND deleted_at IS NULL
          AND id <> %s
          AND id IN (
            SELECT user_id FROM access_requests
            WHERE plan_id = ANY(%s) AND status = 'APPROVED'
          )
    """
    with conn.cursor() as cur:
        cur.execute(sql, (signal["created_by"], signal["plan_ids"]))
        return cur.fetchone()[0]


def actual_counts(conn, signal_id: str):
    sql = """
        SELECT
          (SELECT count(*) FROM notifications
           WHERE type = 'SIGNAL' AND data->>'signalId' = %s) AS notifs,
          (SELECT count(*) FROM notifications n
           JOIN notification_deliveries nd ON nd.notification_id = n.id
           WHERE n.type = 'SIGNAL' AND n.data->>'signalId' = %s
             AND nd.channel = 'EMAIL') AS email_deliveries
    """
    with conn.cursor() as cur:
        cur.execute(sql, (signal_id, signal_id))
        return cur.fetchone()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()

    conn = common.make_db_connection()
    signals = fetch_published_signals(conn, args.days, args.limit)

    if not signals:
        print(f"[notifications] Aucun signal publié sur les {args.days} derniers jours.")
        conn.close()
        return 0

    print(f"[notifications] {len(signals)} signaux publiés analysés\n")
    problems = 0

    for sig in signals:
        expected = expected_recipients(conn, sig)
        notifs, emails = actual_counts(conn, sig["signal_id"])

        status = "OK"
        if notifs == 0 and expected > 0:
            status = "ECHEC: 0 notification créée"
            problems += 1
        elif notifs < expected:
            status = f"PARTIEL: {notifs}/{expected} notifications"
            problems += 1
        elif emails < notifs:
            status = f"EMAIL PARTIEL: {emails}/{notifs} livraisons email"
            problems += 1

        print(f"  {sig['signal_id'][:8]} | attendu={expected} notifs={notifs} emails={emails} | {status}")

    conn.close()
    if problems:
        print(f"\n[ALERTE] {problems} signal(x) avec un problème de distribution.")
        return 1
    print("\n[OK] Tous les signaux ont distribué leurs notifications + emails.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
