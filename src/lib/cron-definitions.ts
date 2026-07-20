/**
 * Source unique de vérité pour les cron jobs de l'application.
 *
 * Sur le VPS de production les crons sont installés via `crontab` (voir scripts/CRONS.md)
 * et leurs logs écrits dans /home/audest/logs/. En environnement de dev (Windows, CI,
 * conteneurs sans crontab) ces commandes système sont indisponibles : on se rabat donc
 * sur cette config statique pour que la page admin "Cron Jobs" s'affiche toujours.
 */

export interface CronDefinition {
  /** Nom stable utilisé comme clé (correspond au nom de script dans CRONS.md). */
  name: string
  /** Libellé français affiché dans l'UI. */
  label: string
  /** Description courte du rôle du cron. */
  desc: string
  /** Expression cron (5 champs) telle qu'installée sur le VPS. */
  schedule: string
  /** Chemin du script exécuté (relatif à la racine du projet). */
  command: string
  /** Chemin du fichier de log produit sur le VPS (peut être null si non tracé). */
  logFile: string | null
  /** Active par défaut ; permet de désactiver l'affichage sans toucher au VPS. */
  enabled: boolean
}

export const CRON_DEFINITIONS: CronDefinition[] = [
  {
    name: "email-stuck-pending",
    label: "Email stuck pending",
    desc: "Marque FAILED les livraisons PENDING > 1h",
    schedule: "0 * * * *",
    command: "scripts/email-stuck-pending.ts",
    logFile: "/home/audest/logs/nba-email.log",
    enabled: true,
  },
  {
    name: "email-reputation-check",
    label: "Réputation email",
    desc: "Calcule bounce/complaint rate + alerte si seuils",
    schedule: "0 2 * * *",
    command: "scripts/email-reputation-check.ts",
    logFile: "/home/audest/logs/nba-rep.log",
    enabled: true,
  },
  {
    name: "cleanup-ghost-access",
    label: "Cleanup accès fantômes",
    desc: "Révoque les accès APPROVED des inactifs/supprimés",
    schedule: "0 3 1 * *",
    command: "scripts/cleanup-ghost-access.ts",
    logFile: "/home/audest/logs/nba-cleanup.log",
    enabled: true,
  },
  {
    name: "cleanup-email-events",
    label: "GDPR email events",
    desc: "Agrège et supprime les email_events > 6 mois",
    schedule: "0 4 * * 0",
    command: "scripts/cleanup-email-events.ts",
    logFile: "/home/audest/logs/nba-email-gdpr.log",
    enabled: true,
  },
  {
    name: "email-daily-digest",
    label: "Digest quotidien",
    desc: "Résumé HTML des activités des dernières 24h",
    schedule: "0 8 * * *",
    command: "scripts/email-daily-digest.ts",
    logFile: "/home/audest/logs/nba-digest.log",
    enabled: true,
  },
  {
    name: "journal-weekly-report",
    label: "Rapport journal hebdo",
    desc: "Rapport de trading de la semaine aux membres",
    schedule: "0 9 * * 1",
    command: "scripts/journal-weekly-report.ts",
    logFile: "/home/audest/logs/nba-weekly.log",
    enabled: true,
  },
  {
    name: "backup-postgres",
    label: "Backup PostgreSQL",
    desc: "Sauvegarde quotidienne chiffrée vers B2 (scripts/backup.sh)",
    schedule: "0 1 * * *",
    command: "scripts/backup.sh",
    logFile: "/home/audest/logs/nba-backup.log",
    enabled: true,
  },
  {
    name: "healthcheck-alert",
    label: "Healthcheck",
    desc: "Alerte de santé des services (scripts/healthcheck.ts)",
    schedule: "*/5 * * * *",
    command: "scripts/healthcheck.ts",
    logFile: "/home/audest/logs/nba-health.log",
    enabled: true,
  },
  {
    name: "monitor",
    label: "Monitor GitHub",
    desc: "Surveillance des dépôts (scripts/monitor/run_all.py)",
    schedule: "0 * * * *",
    command: "scripts/monitor/run_all.py",
    logFile: "/home/audest/logs/nba-monitor.log",
    enabled: true,
  },
  {
    name: "cleanup",
    label: "Cleanup backup",
    desc: "Nettoyage hebdomadaire des anciennes sauvegardes",
    schedule: "0 5 * * 0",
    command: "scripts/cleanup-push.ts",
    logFile: "/home/audest/logs/nba-cleanup-push.log",
    enabled: true,
  },
]

/** Index par nom pour un enrichissement O(1) depuis crontab/logs. */
export const CRON_BY_NAME: Record<string, CronDefinition> = Object.fromEntries(
  CRON_DEFINITIONS.map((c) => [c.name, c]),
)
