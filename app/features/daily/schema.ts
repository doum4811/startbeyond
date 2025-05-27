import { pgTable, uuid, date, text, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

export const dailyRecords = pgTable("daily_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  date: date("date").notNull(),
  category_code: varchar("category_code", { length: 10 }).notNull(),
  subcode: text("subcode"),
  duration: integer("duration"),
  unit: varchar("unit", { length: 10 }).default("min"),
  comment: text("comment"),
  public: boolean("public").default(false),
  linked_plan_id: uuid("linked_plan_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const memos = pgTable("memos", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  record_id: uuid("record_id").notNull().references(() => dailyRecords.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});