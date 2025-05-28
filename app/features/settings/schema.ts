import { pgTable, uuid, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema';
import { sql } from 'drizzle-orm';

export const userCategories = pgTable("user_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  code: varchar("code", { length: 10 }).notNull(),
  label: text("label").notNull(),
  icon: text("icon"),
  color: varchar("color", {length: 7}),
  sort_order: integer("sort_order").default(0).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
  // Consider adding: UNIQUE(profile_id, code)
});

export const userSubcodes = pgTable("user_subcodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  parent_category_code: varchar("parent_category_code", { length: 10 }).notNull(),
  subcode: text("subcode").notNull(),
  description: text("description"),
  frequency_score: integer("frequency_score").default(0).notNull(),
  is_favorite: boolean("is_favorite").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
  // Consider adding: UNIQUE(profile_id, parent_category_code, subcode)
});

export const userCodeSettings = pgTable("user_code_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().unique().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  enable_autocomplete: boolean("enable_autocomplete").default(true).notNull(),
  enable_recommendation: boolean("enable_recommendation").default(true).notNull(),
  recommendation_source: varchar("recommendation_source", { length: 20 }).default("frequency").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
});

export const userDefaultCodePreferences = pgTable("user_default_code_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  default_category_code: varchar("default_category_code", { length: 10 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
  // Add a composite unique key to ensure one preference per user per default code
  // UniqueConstraint: unique(profile_id, default_category_code)
});