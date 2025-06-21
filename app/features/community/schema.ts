import { pgTable, uuid, text, timestamp, varchar, pgPolicy, index } from "drizzle-orm/pg-core";
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
  profileIdx: index("community_posts_profile_id_idx").on(table.profile_id),
  rls: [
    pgPolicy("Allow read access to everyone", { for: "select", to: "all", using: sql`true` }),
    pgPolicy("Allow insert for authenticated users", { for: "insert", to: "authenticated", withCheck: sql`(select auth.uid()) = ${table.profile_id}` }),
    pgPolicy("Allow update for owners", { for: "update", to: "authenticated", using: sql`(select auth.uid()) = ${table.profile_id}`, withCheck: sql`(select auth.uid()) = ${table.profile_id}` }),
    pgPolicy("Allow delete for owners", { for: "delete", to: "authenticated", using: sql`(select auth.uid()) = ${table.profile_id}` }),
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
  postIdx: index("community_comments_post_id_idx").on(table.post_id),
  profileIdx: index("community_comments_profile_id_idx").on(table.profile_id),
  rls: [
    pgPolicy("Allow read access to everyone for comments", { for: "select", to: "all", using: sql`true` }),
    pgPolicy("Allow insert for authenticated users for comments", { for: "insert", to: "authenticated", withCheck: sql`(select auth.uid()) = ${table.profile_id}` }),
    pgPolicy("Allow update for comment owners", { for: "update", to: "authenticated", using: sql`(select auth.uid()) = ${table.profile_id}`, withCheck: sql`(select auth.uid()) = ${table.profile_id}` }),
    pgPolicy("Allow delete for comment owners", { for: "delete", to: "authenticated", using: sql`(select auth.uid()) = ${table.profile_id}` }),
  ]
})); 