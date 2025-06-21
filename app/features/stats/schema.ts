// import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
// import { sql } from "drizzle-orm";
// import type { Database } from "~/types/supabase";
import { pgTable, uuid, text, timestamp, varchar, boolean, jsonb, uniqueIndex, pgPolicy, index } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema'; // Assuming profiles schema exists
import { sql } from 'drizzle-orm';
import type pkg from '@supabase/supabase-js';
import type { Database } from "../../../database.types"; 
import { DateTime } from "luxon";
import { relations } from "drizzle-orm";

export const sharedLinks = pgTable("shared_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  // Unique token for the shared link
  token: text("token").notNull().unique(),
  page_type: text("page_type").notNull(), // e.g., 'summary', 'records', 'advanced'
  period: text("period").notNull(), // e.g., '2024-05', '2024'
  is_public: boolean("is_public").notNull().default(false),
  settings: jsonb("settings"), // e.g., { includeRecords: true, includeMemos: false }
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profilePeriodUnique: uniqueIndex('shared_links_profile_page_period_idx').on(table.profile_id, table.page_type, table.period),
  profileIdx: index("shared_links_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("Allow users to manage their own shared links", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const statsCache = pgTable(
  "stats_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profile_id: uuid("profile_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),
    month_date: text("month_date").notNull(), // YYYY-MM-01
    category_distribution: jsonb("category_distribution").notNull(),
    activity_heatmap: jsonb("activity_heatmap"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      profileMonthUnique: uniqueIndex("stats_cache_profile_month_idx").on(
        table.profile_id,
        table.month_date,
      ),
      profileIdx: index("stats_cache_profile_id_idx").on(table.profile_id),
      rls: pgPolicy("Allow users to manage their own stats cache", {
        for: "all",
        to: "authenticated",
        using: sql`(select auth.uid()) = ${table.profile_id}`,
        withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
      }),
    };
  },
);

// Export derived types
export type SharedLink = typeof sharedLinks.$inferSelect;
export type SharedLinkInsert = typeof sharedLinks.$inferInsert;

export type StatsCache = typeof statsCache.$inferSelect;
export type StatsCacheInsert = typeof statsCache.$inferInsert;
