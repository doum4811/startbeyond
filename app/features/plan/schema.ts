import { pgTable, uuid, date, text, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const dailyPlans = pgTable("daily_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  date: date("date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  duration: integer("duration"),
  unit: varchar("unit", { length: 10 }).default("min"),
  comment: text("comment"),
  is_completed: boolean("is_completed").default(false),
  linked_weekly_task_id: uuid("linked_weekly_task_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const weeklyTasks = pgTable("weekly_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  week_start_date: date("week_start_date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  comment: text("comment").notNull(),
  days: jsonb("days").$type<Record<string, boolean>>(),
  is_locked: boolean("is_locked").default(false),
  from_monthly_goal_id: uuid("from_monthly_goal_id"),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const weeklyNotes = pgTable("weekly_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  week_start_date: date("week_start_date").notNull(), // Removed .unique() to allow multiple notes if needed, or add composite unique key (user_id, week_start_date)
  critical_success_factor: text("critical_success_factor"),
  weekly_see: text("weekly_see"),
  words_of_praise: text("words_of_praise"),
  weekly_goal_note: text("weekly_goal_note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const monthlyGoals = pgTable("monthly_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  month_date: date("month_date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  success_criteria: jsonb("success_criteria").$type<{ id: string; text: string; isCompleted: boolean }[]>(),
  weekly_breakdown: jsonb("weekly_breakdown").$type<{ week1: string; week2: string; week3: string; week4: string }>(),
  is_completed: boolean("is_completed").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const monthlyReflections = pgTable("monthly_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  month_date: date("month_date").notNull(), // Removed .unique() to allow multiple notes if needed, or add composite unique key (user_id, month_date)
  monthly_notes: text("monthly_notes"),
  monthly_reflection: text("monthly_reflection"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});