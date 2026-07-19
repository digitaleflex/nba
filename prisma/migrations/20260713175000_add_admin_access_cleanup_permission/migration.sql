-- Permission dediee au nettoyage des acces APPROVED des utilisateurs
-- inactifs/supprimees ("fantomes"). Assignee a ADMIN et SUPER_ADMIN.

INSERT INTO "permissions" ("id", "name", "description", "module", "created_at")
VALUES (gen_random_uuid(), 'admin.access.cleanup',
        'Nettoyer les acces APPROVED des utilisateurs fantomes', 'admin', NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r.id, p.id, NOW()
FROM "roles" r, "permissions" p
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
  AND p.name = 'admin.access.cleanup'
ON CONFLICT DO NOTHING;
