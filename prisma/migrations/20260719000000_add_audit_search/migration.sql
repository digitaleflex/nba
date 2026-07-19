-- Ajout du champ search_text pour la recherche full-text
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "search_text" TEXT;

-- Index GIN trigram pour les recherches ILIKE performantes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_audit_logs_search_text_gin
  ON "audit_logs" USING gin ("search_text" gin_trgm_ops);

-- Met à jour les lignes existantes
UPDATE "audit_logs"
SET "search_text" = LOWER(CONCAT_WS(' ',
  "action",
  "resource_type",
  COALESCE("details"->>'resourceLabel', '')
))
WHERE "search_text" IS NULL;
