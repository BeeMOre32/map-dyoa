-- Add a guest marker to schedule participants without changing existing member records.
ALTER TABLE "ScheduleParticipant" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Streamer" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;
