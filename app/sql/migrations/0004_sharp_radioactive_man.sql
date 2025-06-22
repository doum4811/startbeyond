ALTER TABLE "daily_notes" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_records" ALTER COLUMN "category_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "record_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plans" ALTER COLUMN "category_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ALTER COLUMN "category_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_linked_plan_id_daily_plans_id_fk" FOREIGN KEY ("linked_plan_id") REFERENCES "public"."daily_plans"("id") ON DELETE set null ON UPDATE no action;