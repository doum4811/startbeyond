import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "~/features/users/schema";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient_id: uuid("recipient_id")
    .notNull()
    .references(() => profiles.profile_id, { onDelete: "cascade" }),
  actor_id: uuid("actor_id").references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  resource_url: text("resource_url"),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
    recipientIdx: index("notifications_recipient_id_idx").on(table.recipient_id),
    actorIdx: index("notifications_actor_id_idx").on(table.actor_id),
    rls: [
        pgPolicy("Allow authenticated users to create notifications", {
            for: "insert",
            to: "authenticated",
            withCheck: sql`true`,
        }),
        pgPolicy("Allow users to view their own notifications", {
            for: "select",
            to: "authenticated",
            using: sql`(select auth.uid()) = ${table.recipient_id}`,
        }),
        pgPolicy("Allow users to update their own notifications", {
            for: "update",
            to: "authenticated",
            using: sql`(select auth.uid()) = ${table.recipient_id}`,
            withCheck: sql`(select auth.uid()) = ${table.recipient_id}`,
        }),
        pgPolicy("Allow users to delete their own notifications", {
            for: "delete",
    to: "authenticated",
    using: sql`(select auth.uid()) = ${table.recipient_id}`,
  }),
    ]
})); 