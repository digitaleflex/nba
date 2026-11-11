-- Données de démonstration pour le développement et les audits (idempotent).
-- Prérequis : `pnpm db:seed` (rôles/plans) et les comptes admin@example.com / membre@example.com
-- créés par scripts/dev/setup-local.sh. NE JAMAIS exécuter en production.

UPDATE users
   SET role_id = (SELECT id FROM roles WHERE name = 'MEMBER'),
       onboarding_status = 'ACTIVE', phone = '+33600000000', country = 'FR'
 WHERE email = 'membre@example.com';

UPDATE users SET onboarding_status = 'ACTIVE' WHERE email = 'admin@example.com';

-- Le membre de démo a un abonnement approuvé (premier plan par ordre d'affichage).
INSERT INTO access_requests (id, user_id, plan_id, status, reviewed_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, (SELECT id FROM subscription_plans ORDER BY sort_order LIMIT 1),
       'APPROVED', now(), now(), now()
  FROM users u
 WHERE u.email = 'membre@example.com'
   AND NOT EXISTS (SELECT 1 FROM access_requests ar WHERE ar.user_id = u.id);

DO $$
DECLARE
  admin_id uuid; member_role uuid; pl uuid; s uuid; i int;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@example.com';
  SELECT id INTO member_role FROM roles WHERE name = 'MEMBER';

  -- 8 signaux publiés, visibles par tous les plans
  IF NOT EXISTS (SELECT 1 FROM signals) THEN
    FOR i IN 1..8 LOOP
      s := gen_random_uuid();
      INSERT INTO signals (id, content, status, created_by, published_at,
                           suggested_stop_loss, suggested_take_profit, created_at, updated_at)
      VALUES (s,
        CASE WHEN i % 2 = 0
          THEN 'BUY XAUUSD @ 2385.50' || chr(10) || 'SL 2378 / TP1 2392 / TP2 2400' || chr(10) || 'Entrée sur cassure de range H1, gestion stricte.'
          ELSE 'SELL EURUSD @ 1.0842' || chr(10) || 'SL 1.0870 / TP 1.0790' || chr(10) || 'Rejet zone de résistance D1.' END,
        'PUBLISHED', admin_id, now() - (i || ' hours')::interval, 2378, 2392,
        now() - (i || ' hours')::interval, now());
      FOR pl IN SELECT id FROM subscription_plans LOOP
        INSERT INTO signal_audience (id, signal_id, plan_id) VALUES (gen_random_uuid(), s, pl);
      END LOOP;
    END LOOP;
  END IF;

  -- 6 prospects à différents stades d'onboarding, avec une demande d'accès en attente
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'prospect1@example.com') THEN
    FOR i IN 1..6 LOOP
      INSERT INTO users (id, name, email, email_verified, role_id, onboarding_status, created_at, updated_at, country, phone)
      VALUES (gen_random_uuid(), 'Prospect ' || i, 'prospect' || i || '@example.com', true, member_role,
        (ARRAY['REGISTERED','PAYMENT_PENDING','KYC_PENDING','BROKER_PENDING','PAYMENT_PENDING','KYC_PENDING'])[i]::"OnboardingStatus",
        now() - (i || ' days')::interval, now(), 'SN', '+22100000000' || i);
    END LOOP;
    INSERT INTO access_requests (id, user_id, plan_id, status, created_at, updated_at)
    SELECT gen_random_uuid(), id, (SELECT id FROM subscription_plans ORDER BY sort_order LIMIT 1), 'PENDING', now(), now()
      FROM users WHERE email LIKE 'prospect%@example.com';
  END IF;
END $$;
