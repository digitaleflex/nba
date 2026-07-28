-- Ajout des ON DELETE CASCADE / SET NULL manquants
-- Évite les orphelins en base quand un utilisateur ou une notification est supprimé

-- Notification → User : supprimer les notifications si l'utilisateur est supprimé
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey",
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- NotificationDelivery → Notification : supprimer les deliveries si la notification est supprimée
ALTER TABLE "notification_deliveries" DROP CONSTRAINT "notification_deliveries_notification_id_fkey",
  ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE;

-- AccessRequest → User : supprimer les demandes si l'utilisateur est supprimé
ALTER TABLE "access_requests" DROP CONSTRAINT "access_requests_user_id_fkey",
  ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- AccessRequest → Plan : supprimer les demandes si le plan est supprimé
ALTER TABLE "access_requests" DROP CONSTRAINT "access_requests_plan_id_fkey",
  ADD CONSTRAINT "access_requests_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE;

-- AccessRequest → Reviewer : mettre à NULL le reviewer si l'admin est supprimé
ALTER TABLE "access_requests" DROP CONSTRAINT "access_requests_reviewed_by_fkey",
  ADD CONSTRAINT "access_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;
