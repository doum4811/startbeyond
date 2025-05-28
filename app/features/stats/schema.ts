import { pgTable, uuid, boolean, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema';
import { sql } from 'drizzle-orm';

export const shareSettings = pgTable("share_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().unique().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  is_public: boolean("is_public").default(false).notNull(),
  include_records: boolean("include_records").default(true).notNull(),
  include_daily_notes: boolean("include_daily_notes").default(true).notNull(),
  include_memos: boolean("include_memos").default(false).notNull(),
  include_stats: boolean("include_stats").default(true).notNull(),
  share_link_token: text("share_link_token").unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
});