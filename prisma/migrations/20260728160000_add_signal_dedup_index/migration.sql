-- Empêche la création de notifications en double pour un même signal/membre
-- au niveau base de données (TOCTOU-proof)
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_signal_user_dedup_idx"
ON "notifications" ("user_id", ("data"->>'signalId'))
WHERE "type" = 'SIGNAL' AND ("data"->>'signalId') IS NOT NULL;
