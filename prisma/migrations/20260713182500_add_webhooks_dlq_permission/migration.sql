-- Permission dediee a la gestion de la DLQ des webhooks (admin only).
INSERT INTO "permissions" ("id", "name", "description", "module", "created_at")
VALUES (gen_random_uuid(), 'admin.webhooks.dlq',
        'Voir et rejouer la DLQ des webhooks', 'admin', NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r.id, p.id, NOW()
FROM "roles" r, "permissions" p
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
  AND p.name = 'admin.webhooks.dlq'
ON CONFLICT DO NOTHING;
