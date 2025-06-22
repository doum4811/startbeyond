import { pgTable, uuid, date, text, integer, boolean, timestamp, varchar, pgPolicy, index } from "drizzle-orm/pg-core";
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
}, (table) => ({
  profileIdx: index("daily_records_profile_id_idx").on(table.profile_id),
  rls: [
    pgPolicy("Allow read on own or public records_v2", {
        for: "select",
        to: "authenticated",
        using: sql`(${table.profile_id} = (select auth.uid())) OR (is_public = true)`
    }),
    pgPolicy("Allow insert on own records_v2", {
        for: "insert",
        to: "authenticated",
        using: sql`${table.profile_id} = (select auth.uid())`,
        withCheck: sql`${table.profile_id} = (select auth.uid())`
    }),
    pgPolicy("Allow update on own records_v2", {
        for: "update",
        to: "authenticated",
        using: sql`${table.profile_id} = (select auth.uid())`,
        withCheck: sql`${table.profile_id} = (select auth.uid())`
    }),
    pgPolicy("Allow delete on own records_v2", {
        for: "delete",
        to: "authenticated",
        using: sql`${table.profile_id} = (select auth.uid())`
    }),
  ]
}));

export const dailyNotes = pgTable("daily_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileIdx: index("daily_notes_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("Allow full access for owners", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const memos = pgTable("memos", {
  id: uuid("id").primaryKey().defaultRandom(),
  record_id: uuid("record_id").references(() => dailyRecords.id, { onDelete: "cascade" }),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  recordIdx: index("memos_record_id_idx").on(table.record_id),
  profileIdx: index("memos_profile_id_idx").on(table.profile_id),
  rls: [
    pgPolicy("Allow read on memos for own or public records", {
      for: "select",
      to: "authenticated",
      using: sql`(${table.profile_id} = (select auth.uid())) OR (exists (select 1 from daily_records where daily_records.id = ${table.record_id} and daily_records.is_public = true))`
    }),
    pgPolicy("Allow insert on memos for own records", {
        for: "insert",
        to: "authenticated",
        withCheck: sql`${table.profile_id} = (select auth.uid())`
    }),
    pgPolicy("Allow update on memos for own records", {
        for: "update",
        to: "authenticated",
        using: sql`${table.profile_id} = (select auth.uid())`
    }),
    pgPolicy("Allow delete on memos for own records", {
        for: "delete",
        to: "authenticated",
        using: sql`${table.profile_id} = (select auth.uid())`
    }),
  ]
}));