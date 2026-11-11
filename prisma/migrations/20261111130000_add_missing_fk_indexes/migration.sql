-- Index FK manquants (#83) — CREATE INDEX uniquement, aucune modification de donnees
CREATE INDEX IF NOT EXISTS "signal_versions_signal_id_idx" ON "signal_versions"("signal_id");
CREATE INDEX IF NOT EXISTS "broker_verifications_user_id_idx" ON "broker_verifications"("user_id");
