import { pgTable, uuid, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const userCategories = pgTable("user_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  label: text("label").notNull(),
  icon: text("icon"),
  color: varchar("color", {length: 7}),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Consider adding: UNIQUE(user_id, category_code)
});

export const userSubcodes = pgTable("user_subcodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode").notNull(),
  description: text("description"),
  frequency_score: integer("frequency_score").default(0),
  is_favorite: boolean("is_favorite").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Consider adding: UNIQUE(user_id, category_code, subcode)
});

export const userCodeSettings = pgTable("user_code_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique(),
  enable_autocomplete: boolean("enable_autocomplete").default(true),
  enable_recommendation: boolean("enable_recommendation").default(true),
  recommendation_source: varchar("recommendation_source", { length: 20 }).default("frequency"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userDefaultCodePreferences = pgTable("user_default_code_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  default_category_code: varchar("default_category_code", { length: 10 }).notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Add a composite unique key to ensure one preference per user per default code
  // UniqueConstraint: unique(user_id, default_category_code)
});