import { pgTable, uuid, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const shareSettings = pgTable("share_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique(),
  is_public: boolean("is_public").default(false),
  include_records: boolean("include_records").default(true),
  include_daily_notes: boolean("include_daily_notes").default(true),
  include_memos: boolean("include_memos").default(false),
  include_stats: boolean("include_stats").default(true),
  share_link_token: text("share_link_token").unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});