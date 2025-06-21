import { pgTable, text, timestamp, uuid, primaryKey, boolean, pgPolicy, foreignKey, index } from "drizzle-orm/pg-core";
import { profiles } from "~/features/users/schema";
import { sql } from "drizzle-orm";

// 대화 (두 사용자 간의 채팅방)
export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    participant1_id: uuid("participant1_id").notNull(),
    participant2_id: uuid("participant2_id").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    participant1Fk: foreignKey({
        columns: [table.participant1_id],
        foreignColumns: [profiles.profile_id],
        name: "conversations_participant1_id_fkey"
    }).onDelete("cascade"),
    participant2Fk: foreignKey({
        columns: [table.participant2_id],
        foreignColumns: [profiles.profile_id],
        name: "conversations_participant2_id_fkey"
    }).onDelete("cascade"),
    participant1Idx: index("conversations_participant1_id_idx").on(table.participant1_id),
    participant2Idx: index("conversations_participant2_id_idx").on(table.participant2_id),
    rls: pgPolicy("conversations_rls", {
        for: "all",
        to: "authenticated",
        using: sql`(select auth.uid()) = ${table.participant1_id} OR (select auth.uid()) = ${table.participant2_id}`,
        withCheck: sql`(select auth.uid()) = ${table.participant1_id} OR (select auth.uid()) = ${table.participant2_id}`,
    }),
}));

// 메시지 (대화에 속한 각 메시지)
export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    sender_id: uuid("sender_id").notNull().references(() => profiles.profile_id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    is_read: boolean("is_read").default(false).notNull(),
}, (table) => ({
    conversationIdx: index("messages_conversation_id_idx").on(table.conversation_id),
    senderIdx: index("messages_sender_id_idx").on(table.sender_id),
    rls: pgPolicy("messages_rls", {
        for: "all",
        to: "authenticated",
        using: sql`
            (select auth.uid()) = ${table.sender_id} OR
            (
                SELECT true
                FROM conversations c
                WHERE c.id = ${table.conversation_id}
                AND (c.participant1_id = (select auth.uid()) OR c.participant2_id = (select auth.uid()))
            )
        `,
        withCheck: sql`
            (select auth.uid()) = ${table.sender_id} AND
            (
                SELECT true
                FROM conversations c
                WHERE c.id = ${table.conversation_id}
                AND (c.participant1_id = (select auth.uid()) OR c.participant2_id = (select auth.uid()))
            )
        `,
    }),
})); 