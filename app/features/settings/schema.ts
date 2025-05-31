import { pgTable, uuid, text, varchar, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema';
import { sql } from 'drizzle-orm';

export const userCategories = pgTable("user_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  code: varchar("code", { length: 10 }).notNull(),
  label: text("label").notNull(),
  icon: text("icon"),
  color: varchar("color", { length: 7 }),
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
}, (table) => {
  return {
    profileDefaultCodeUnique: uniqueIndex('user_default_pref_profile_code_idx').on(table.profile_id, table.default_category_code),
  };
});

interface UICategory {
  code: string; // CategoryCode 또는 사용자 정의 코드
  label: string;
  icon: string | null; // 사용자 정의는 null일 수 있음
  color?: string | null; // 사용자 정의 코드의 색상
  isCustom: boolean;
  isActive: boolean; // settings-page와 연동
  hasDuration?: boolean; // 기본 코드에서 가져옴
  // 필요하다면 sort_order 등 추가
}