-- Add suggested SL/TP to signals (non-destructive)
ALTER TABLE "signals" ADD COLUMN IF NOT EXISTS "suggested_stop_loss" DECIMAL(12, 5);
ALTER TABLE "signals" ADD COLUMN IF NOT EXISTS "suggested_take_profit" DECIMAL(12, 5);
