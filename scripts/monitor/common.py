"""Outils communs pour le monitoring (Resend + PostgreSQL).

Lit DATABASE_URL et RESEND_API_KEY depuis l'environnement (ou un fichier .env).
"""
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


def require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"[monitor] Variable d'environnement manquante: {name}")
    return val


def get_database_url() -> str:
    return require_env("DATABASE_URL")


def get_resend_key() -> str:
    return require_env("RESEND_API_KEY")


def make_db_connection():
    import psycopg2
    return psycopg2.connect(get_database_url())


def resend_get_email(email_id: str, api_key: str) -> dict | None:
    """Récupère le statut de livraison d'un email via l'API Resend."""
    import requests

    url = f"https://api.resend.com/emails/{email_id}"
    try:
        r = requests.get(url, headers={"Authorization": f"Bearer {api_key}"}, timeout=10)
    except requests.RequestException as e:
        return {"error": str(e)}
    if r.status_code != 200:
        return {"error": f"HTTP {r.status_code}: {r.text[:200]}"}
    return r.json().get("data", {})


def classify(status: dict | None) -> str:
    if not status or "error" in status:
        return "unknown"
    if status.get("complained_at"):
        return "complained"
    if status.get("bounced_at"):
        return "bounced"
    if status.get("opened_at"):
        return "opened"
    if status.get("delivered_at"):
        return "delivered"
    evt = status.get("last_event")
    return {
        "delivered": "delivered",
        "bounced": "bounced",
        "complained": "complained",
        "opened": "opened",
        "queued": "pending",
        "sending": "pending",
    }.get(evt, "unknown")
