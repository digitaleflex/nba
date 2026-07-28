-- Index composite pour le chargement paginé des messages par conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at" DESC);

-- Index composite pour les queries de queue (channel + status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_deliveries_channel_status_idx" ON "notification_deliveries" ("channel", "status");

-- Index composite pour l'admin (demandes en attente triées par date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "access_requests_status_created_at_idx" ON "access_requests" ("status", "created_at");

-- Index GIN sur le JSONB data des notifications pour la déduplication des signaux
-- Accélère la requête: WHERE type = 'SIGNAL' AND data->'signalId' = '...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_type_data_signal_id_idx" ON "notifications" ("type", ("data"->>'signalId'));
