import { pgTable, uuid, date, text, integer, boolean, timestamp, varchar, pgPolicy } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema';
import { sql } from 'drizzle-orm';

export const dailyRecords = pgTable("daily_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  duration_minutes: integer("duration_minutes"),
  comment: text("comment"),
  is_public: boolean("is_public").default(false).notNull(),
  linked_plan_id: uuid("linked_plan_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ([
  pgPolicy("daily_records_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid() = ${table.profile_id}`,
    withCheck: sql`auth.uid() = ${table.profile_id}`,
  }),
]));

export const dailyNotes = pgTable("daily_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ([
  pgPolicy("daily_notes_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid() = ${table.profile_id}`,
    withCheck: sql`auth.uid() = ${table.profile_id}`,
  }),
]));

export const memos = pgTable("memos", {
  id: uuid("id").primaryKey().defaultRandom(),
  record_id: uuid("record_id").references(() => dailyRecords.id, { onDelete: "cascade" }),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ([
  pgPolicy("memos_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid() = ${table.profile_id}`,
    withCheck: sql`auth.uid() = ${table.profile_id}`,
  }),
]));