import { pgTable, uuid, text, timestamp, varchar, pgPolicy } from "drizzle-orm/pg-core";
import { profiles } from '../users/schema'; // Assuming profiles schema exists
import { sql } from 'drizzle-orm';

export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }), // e.g., "목표공유", "팁", "자유"
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  rls: [
    pgPolicy("Allow all users to read community posts", {
        for: "select",
        using: sql`true`,
    }),
    pgPolicy("Allow authenticated users to manage their own posts", {
        for: "all",
        to: "authenticated",
        using: sql`auth.uid() = ${table.profile_id}`,
        withCheck: sql`auth.uid() = ${table.profile_id}`,
    }),
  ]
}));

export const communityComments = pgTable("community_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  post_id: uuid("post_id").notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  profile_id: uuid("profile_id").notNull().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => sql`now()`),
}, (table) => ({
  rls: pgPolicy("community_comments_rls", {
    for: "all",
    to: "authenticated",
    using: sql`auth.uid() = ${table.profile_id}`,
    withCheck: sql`auth.uid() = ${table.profile_id}`,
  }),
})); 