-- Ajoute la colonne ba_role sur User (rôle better-auth pour l'impersonation admin).
-- Colonne optionnelle (nullable) : non destructive, aucune perte de données.
-- Valeurs : "admin" (ADMIN/SUPER_ADMIN) ou "user", null = membre standard.
-- Initialisée par le backfill après coup.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ba_role" text;
