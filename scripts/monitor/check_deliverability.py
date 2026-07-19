"""Vérifie la délivrabilité des emails de signaux via Resend.

Pour chaque livraison email récente (notification SIGNAL) stockée en base avec un
external_id (ID Resend), interroge l'API Resend et agrège les statuts
(delivered / opened / bounced / complained).

Usage:
    python scripts/monitor/check_deliverability.py [--days 7] [--bounce-threshold 5]
"""
import sys
import argparse
from collections import defaultdict

import common


def fetch_recent_deliveries(conn, days: int, limit: int = 1000):
    sql = """
        SELECT nd.id AS delivery_id,
               nd.external_id,
               nd.status AS db_status,
               n.data->>'signalId' AS signal_id,
               u.email,
               u.name
        FROM notification_deliveries nd
        JOIN notifications n ON n.id = nd.notification_id
        JOIN users u ON u.id = n.user_id
        WHERE nd.channel = 'EMAIL'
          AND nd.external_id IS NOT NULL
          AND nd.created_at >= NOW() - (%s::int || ' days')::interval
        ORDER BY nd.created_at DESC
        LIMIT %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (days, limit))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--bounce-threshold", type=int, default=5)
    args = parser.parse_args()

    api_key = common.get_resend_key()
    conn = common.make_db_connection()

    rows = fetch_recent_deliveries(conn, args.days, args.limit)
    if not rows:
        print(f"[deliverabilite] Aucune livraison email trouvée sur les {args.days} derniers jours.")
        conn.close()
        return 0

    print(f"[deliverabilite] {len(rows)} livraisons email analysées (Resend) sur {args.days}j\n")

    totals = defaultdict(int)
    per_signal = defaultdict(lambda: defaultdict(int))

    for row in rows:
        status = common.resend_get_email(row["external_id"], api_key)
        bucket = common.classify(status)
        totals[bucket] += 1
        per_signal[row["signal_id"]][bucket] += 1

    print("=== Résumé global ===")
    for k in ("delivered", "opened", "bounced", "complained", "pending", "unknown"):
        print(f"  {k:>10}: {totals.get(k, 0)}")

    print("\n=== Par signal ===")
    for signal_id, buckets in per_signal.items():
        parts = ", ".join(f"{k}={v}" for k, v in buckets.items())
        print(f"  {signal_id}: {parts}")

    bounces = totals.get("bounced", 0) + totals.get("complained", 0)
    conn.close()

    if bounces > args.bounce_threshold:
        print(f"\n[ALERTE] {bounces} bounces/plaintes > seuil {args.bounce_threshold}")
        return 1
    print("\n[OK] Délivrabilité dans les seuils.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
