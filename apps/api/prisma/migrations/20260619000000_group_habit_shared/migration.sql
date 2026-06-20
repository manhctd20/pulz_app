-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "CheckIn_habitId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_habitId_userId_date_key" ON "CheckIn"("habitId", "userId", "date");
