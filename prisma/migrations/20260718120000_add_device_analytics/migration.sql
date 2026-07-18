-- Ajoute les champs d'analyse d'appareil (type, marque, modèle, OS, navigateur).
-- Toutes les colonnes sont NULLABLE : migration purement additive, aucune perte de données.
-- Ces données servent à optimiser l'expérience mobile (iOS/Safari, etc.).

-- Table devices
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "device_type" text;
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "brand" text;
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "model" text;
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "os" text;
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "browser" text;

CREATE INDEX IF NOT EXISTS "devices_device_type_idx" ON "devices" ("device_type");
CREATE INDEX IF NOT EXISTS "devices_brand_idx" ON "devices" ("brand");

-- Table device_verifications
ALTER TABLE "device_verifications" ADD COLUMN IF NOT EXISTS "device_type" text;
ALTER TABLE "device_verifications" ADD COLUMN IF NOT EXISTS "brand" text;
ALTER TABLE "device_verifications" ADD COLUMN IF NOT EXISTS "model" text;
ALTER TABLE "device_verifications" ADD COLUMN IF NOT EXISTS "os" text;
ALTER TABLE "device_verifications" ADD COLUMN IF NOT EXISTS "browser" text;
