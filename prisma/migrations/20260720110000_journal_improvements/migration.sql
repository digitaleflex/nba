-- Ajout des améliorations du Trading Journal
-- strategy / setupType sur Trade, timezone sur User, lastDisciplineDay sur Streak
-- Les enums TradeStrategy / TradeSetup / (StreakType.DISCIPLINE_STREAK existant) sont ajoutés.

-- Enums
CREATE TYPE "TradeStrategy" AS ENUM ('SCALPING', 'DAY_TRADING', 'SWING', 'POSITION');
CREATE TYPE "TradeSetup" AS ENUM ('BREAKOUT', 'PULLBACK', 'REVERSAL', 'RANGE', 'TREND', 'OTHER');

-- Trade.strategy / setupType
ALTER TABLE "trades" ADD COLUMN "strategy" "TradeStrategy";
ALTER TABLE "trades" ADD COLUMN "setupType" "TradeSetup";

-- User.timezone
ALTER TABLE "users" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris';

-- Streak.lastDisciplineDay
ALTER TABLE "streaks" ADD COLUMN "last_discipline_day" TIMESTAMP(3);
