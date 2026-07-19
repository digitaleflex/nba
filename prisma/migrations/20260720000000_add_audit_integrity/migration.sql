-- Ajout des colonnes hash et previous_hash pour la chaîne d'intégrité
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "previous_hash" TEXT;

-- Index unique pour garantir l'unicité des hash
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS audit_logs_hash_unique;
ALTER TABLE "audit_logs" ADD CONSTRAINT audit_logs_hash_unique UNIQUE ("hash");

-- Index pour les parcours de chaîne par createdAt
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_id
  ON "audit_logs" ("created_at", "id");
