-- CreateTable
CREATE TABLE "email_stats_monthly" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "complained" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "delivery_delayed" INTEGER NOT NULL DEFAULT 0,
    "suppressed" INTEGER NOT NULL DEFAULT 0,
    "open_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "click_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounce_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_stats_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_stats_monthly_year_month_key" ON "email_stats_monthly"("year", "month");

