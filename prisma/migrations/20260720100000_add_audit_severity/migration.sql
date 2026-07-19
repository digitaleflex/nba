-- Ajout du niveau de criticité (severity) pour les logs d'audit
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "severity" TEXT NOT NULL DEFAULT 'info';

-- Index pour filtrer par criticité
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON "audit_logs" ("severity");
