import {
    jsonb,
    pgEnum,
    pgSchema,
    pgTable,
    text,
    timestamp,
    uuid,
    pgPolicy,
    primaryKey,
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
  }, (table) => ({
    rls: [
        pgPolicy("Allow public read-only access to profiles", {
            for: "select",
            to: "all",
            using: sql`true`,
        }),
        pgPolicy("Allow users to update their own profile", {
            for: "update",
            to: "authenticated",
            using: sql`auth.uid() = ${table.profile_id}`,
        }),
    ]
  }));
  
  export const follows = pgTable("follows", {
    follower_id: uuid("follower_id").notNull().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    following_id: uuid("following_id").notNull().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    created_at: timestamp("created_at").notNull().defaultNow(),
  }, (table) => ({
    pk: primaryKey({ columns: [table.follower_id, table.following_id] }),
    rls: [
      pgPolicy("Allow users to see their own follow relationships", {
        for: "select",
        to: "authenticated",
        using: sql`auth.uid() = ${table.follower_id} OR auth.uid() = ${table.following_id}`,
      }),
      pgPolicy("Allow users to follow others", {
        for: "insert",
        to: "authenticated",
        withCheck: sql`auth.uid() = ${table.follower_id}`,
      }),
      pgPolicy("Allow users to unfollow others", {
        for: "delete",
        to: "authenticated",
        using: sql`auth.uid() = ${table.follower_id}`,
      }),
    ]
  }));