import { pgTable, uuid, date, text, integer, boolean, timestamp, varchar, jsonb, uniqueIndex, pgPolicy, index } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema';
import { sql } from 'drizzle-orm';

export const dailyPlans = pgTable("daily_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  plan_date: date("plan_date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  duration_minutes: integer("duration_minutes"),
  comment: text("comment"),
  is_completed: boolean("is_completed").default(false).notNull(),
  linked_weekly_task_id: uuid("linked_weekly_task_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileIdx: index("daily_plans_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("daily_plans_rls", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const weeklyTasks = pgTable("weekly_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  week_start_date: date("week_start_date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  comment: text("comment").notNull(),
  days: jsonb("days").$type<Record<string, boolean>>(),
  is_locked: boolean("is_locked").default(false).notNull(),
  from_monthly_goal_id: uuid("from_monthly_goal_id"),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileIdx: index("weekly_tasks_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("weekly_tasks_rls", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const weeklyNotes = pgTable("weekly_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  week_start_date: date("week_start_date").notNull(),
  critical_success_factor: text("critical_success_factor"),
  weekly_see: text("weekly_see"),
  words_of_praise: text("words_of_praise"),
  weekly_goal_note: text("weekly_goal_note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileIdx: index("weekly_notes_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("weekly_notes_rls", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const monthlyGoals = pgTable("monthly_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  month_date: date("month_date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  success_criteria: jsonb("success_criteria").$type<{ id: string; text: string; isCompleted: boolean }[]>(),
  weekly_breakdown: jsonb("weekly_breakdown").$type<{ week1: string; week2: string; week3: string; week4: string; week5?: string }>(),
  is_completed: boolean("is_completed").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileIdx: index("monthly_goals_profile_id_idx").on(table.profile_id),
  rls: pgPolicy("monthly_goals_rls", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));

export const monthlyReflections = pgTable("monthly_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  month_date: date("month_date").notNull(),
  monthly_reflection: text("monthly_reflection"),
  monthly_notes: text("monthly_notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  profileMonthUnique: uniqueIndex('monthly_reflections_profile_month_idx').on(table.profile_id, table.month_date),
  rls: pgPolicy("monthly_reflections_rls", {
    for: "all",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.profile_id}`,
    withCheck: sql`(select auth.uid()) = ${table.profile_id}`,
  }),
}));