import {
    jsonb,
    pgEnum,
    pgSchema,
    pgTable,
    text,
    timestamp,
    uuid,
  } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { authUsers } from "drizzle-orm/supabase";

  
  // const users = pgSchema("auth").table("users", {
  //   id: uuid('id').primaryKey(),
  // });
  
//   export const roles = pgEnum("role", [
//     "developer",
//     "designer",
//     "marketer",
//     "founder",
//     "product-manager",
//   ]);
  
export const profiles = pgTable("profiles", {
    profile_id: uuid('profile_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    avatar: text('avatar_url'),
    name: text('full_name').notNull(),
    username: text('username').notNull(),
    headline: text('headline'),
    bio: text('bio'),
    daily_record_visibility: text('daily_record_visibility', {
      enum: ["public", "followers", "private"],
    }).default("followers").notNull(),
    // role: roles().default("developer").notNull(),
    stats: jsonb('stats').$type<{
      followers: number;
      following: number;
    }>(),
    views: jsonb('views'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => sql`now()`),
  });
  
  export const follows = pgTable("follows", {
    follower_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    following_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    created_at: timestamp().notNull().defaultNow(),
  });