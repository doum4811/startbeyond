import { pgTable, text, timestamp, uuid, primaryKey, boolean } from "drizzle-orm/pg-core";
import { profiles } from "~/features/users/schema";

// 대화 (두 사용자 간의 채팅방)
export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    participant1_id: uuid("participant1_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
    participant2_id: uuid("participant2_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 메시지 (대화에 속한 각 메시지)
export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    sender_id: uuid("sender_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    is_read: boolean("is_read").default(false).notNull(),
}); 