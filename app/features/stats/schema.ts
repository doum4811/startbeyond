// import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
// import { sql } from "drizzle-orm";
// import type { Database } from "~/types/supabase";
import { pgTable, uuid, text, timestamp, varchar, boolean, jsonb, pgPolicy, uniqueIndex } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema'; // Assuming profiles schema exists
import { sql } from 'drizzle-orm';
import type pkg from '@supabase/supabase-js';
import type { Database } from "../../../database.types"; 
import { DateTime } from "luxon";

export const shareSettings = pgTable("share_settings", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  profile_id: text("profile_id").notNull(),
  is_public: boolean("is_public").notNull().default(false),
  include_records: boolean("include_records").notNull().default(true),
  include_daily_notes: boolean("include_daily_notes").notNull().default(true),
  include_memos: boolean("include_memos").notNull().default(false),
  include_stats: boolean("include_stats").notNull().default(true),
  share_link_token: text("share_link_token"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  rls: pgPolicy("share_settings_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid()::text = ${table.profile_id}`,
    withCheck: sql`auth.uid()::text = ${table.profile_id}`,
  }),
}));

export const statsCache = pgTable("stats_cache", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  profile_id: text("profile_id").notNull(),
  month_date: text("month_date").notNull(), // YYYY-MM
  category_distribution: jsonb("category_distribution"),
  activity_heatmap: jsonb("activity_heatmap"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  profileMonthUnique: uniqueIndex('stats_cache_profile_month_idx').on(table.profile_id, table.month_date),
  rls: pgPolicy("stats_cache_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid()::text = ${table.profile_id}`,
    withCheck: sql`auth.uid()::text = ${table.profile_id}`,
  }),
}));

// Export derived types
export type ShareSettingsInsert = typeof shareSettings.$inferInsert;
export type ShareSettingsUpdate = typeof shareSettings.$inferSelect; // Or $inferUpdate if specific update type is needed

export type StatsCacheRow = typeof statsCache.$inferSelect;
export type StatsCacheInsert = typeof statsCache.$inferInsert;
export type StatsCacheUpdate = typeof statsCache.$inferSelect; // Or $inferUpdate
