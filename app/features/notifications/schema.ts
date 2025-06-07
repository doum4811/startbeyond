import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
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
  resource_url: text("resource_url"),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}); 