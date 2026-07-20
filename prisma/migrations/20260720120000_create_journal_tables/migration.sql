-- Création des tables du Trading Journal manquantes en base (schema drift).
-- trades, journal_sessions, daily_reflections, streaks + enums associés.
-- Idempotent (IF NOT EXISTS) car certains enums (TradeStrategy/TradeSetup)
-- peuvent déjà exister via 20260720110000_journal_improvements.

-- Enums
CREATE TYPE IF NOT EXISTS "Direction" AS ENUM ('BUY', 'SELL');
CREATE TYPE IF NOT EXISTS "TradeResult" AS ENUM ('WIN', 'LOSS', 'BREAKEVEN');
CREATE TYPE IF NOT EXISTS "Mood" AS ENUM ('CONFIDENT', 'NEUTRAL', 'ANXIOUS', 'FEARFUL', 'GREEDY', 'REVENGE');
CREATE TYPE IF NOT EXISTS "StreakType" AS ENUM ('WIN_STREAK', 'LOSS_STREAK', 'DISCIPLINE_STREAK');
CREATE TYPE IF NOT EXISTS "TradeStrategy" AS ENUM ('SCALPING', 'DAY_TRADING', 'SWING', 'POSITION');
CREATE TYPE IF NOT EXISTS "TradeSetup" AS ENUM ('BREAKOUT', 'PULLBACK', 'REVERSAL', 'RANGE', 'TREND', 'OTHER');

-- trades
CREATE TABLE IF NOT EXISTS "trades" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "signal_id" UUID,
    "session_id" UUID,
    "pair" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "result" "TradeResult" NOT NULL,
    "entry_price" DECIMAL(12,5) NOT NULL,
    "exit_price" DECIMAL(12,5) NOT NULL,
    "stop_loss" DECIMAL(12,5),
    "take_profit" DECIMAL(12,5),
    "lot_size" DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    "pnl" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "spread" DECIMAL(12,2) DEFAULT 0,
    "commission" DECIMAL(12,2) DEFAULT 0,
    "swap" DECIMAL(12,2) DEFAULT 0,
    "mood" "Mood",
    "confidence" INTEGER,
    "note" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strategy" "TradeStrategy",
    "setupType" "TradeSetup",
    "traded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- journal_sessions
CREATE TABLE IF NOT EXISTS "journal_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_sessions_pkey" PRIMARY KEY ("id")
);

-- daily_reflections
CREATE TABLE IF NOT EXISTS "daily_reflections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "rating" INTEGER NOT NULL,
    "mood" "Mood",
    "trade_count" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "total_pnl" DECIMAL(12,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reflections_pkey" PRIMARY KEY ("id")
);

-- streaks
CREATE TABLE IF NOT EXISTS "streaks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "StreakType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "best_count" INTEGER NOT NULL DEFAULT 0,
    "last_discipline_day" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX IF NOT EXISTS "trades_user_id_deleted_at_traded_at_idx" ON "trades"("user_id", "deleted_at", "traded_at");
CREATE INDEX IF NOT EXISTS "trades_signal_id_idx" ON "trades"("signal_id");
CREATE INDEX IF NOT EXISTS "trades_session_id_idx" ON "trades"("session_id");
CREATE INDEX IF NOT EXISTS "journal_sessions_user_id_is_active_idx" ON "journal_sessions"("user_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_reflections_user_id_date_key" ON "daily_reflections"("user_id", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "streaks_user_id_type_key" ON "streaks"("user_id", "type");

-- Foreign keys
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trades" ADD CONSTRAINT "trades_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trades" ADD CONSTRAINT "trades_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "journal_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "journal_sessions" ADD CONSTRAINT "journal_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journal_sessions" ADD CONSTRAINT "journal_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "daily_reflections" ADD CONSTRAINT "daily_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
