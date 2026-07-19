-- CreateTable
CREATE TABLE "email_reputation_history" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "window" TEXT NOT NULL,
    "sent" INTEGER NOT NULL,
    "delivered" INTEGER NOT NULL,
    "opened" INTEGER NOT NULL,
    "clicked" INTEGER NOT NULL,
    "bounced" INTEGER NOT NULL,
    "complained" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "bounceRate" DOUBLE PRECISION NOT NULL,
    "complaint_rate" DOUBLE PRECISION NOT NULL,
    "open_rate" DOUBLE PRECISION NOT NULL,
    "click_rate" DOUBLE PRECISION NOT NULL,
    "alert_level" TEXT NOT NULL DEFAULT 'ok',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_reputation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_reputation_history_date_key" ON "email_reputation_history"("date");

-- CreateIndex
CREATE INDEX "email_reputation_history_window_date_idx" ON "email_reputation_history"("window", "date");

