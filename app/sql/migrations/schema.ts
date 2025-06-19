import { pgTable, foreignKey, pgPolicy, uuid, text, varchar, timestamp, date, integer, boolean, jsonb, uniqueIndex, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const communityPosts = pgTable("community_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "community_posts_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("community_posts_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
	pgPolicy("Allow all users to read community posts", { as: "permissive", for: "select", to: ["public"] }),
]);

export const communityComments = pgTable("community_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "community_comments_post_id_community_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "community_comments_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("community_comments_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const follows = pgTable("follows", {
	followerId: uuid("follower_id"),
	followingId: uuid("following_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [profiles.profileId],
			name: "follows_follower_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [profiles.profileId],
			name: "follows_following_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
]);

export const dailyNotes = pgTable("daily_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	date: date().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "daily_notes_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("daily_notes_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const dailyRecords = pgTable("daily_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	date: date().notNull(),
	categoryCode: varchar("category_code", { length: 10 }).notNull(),
	subcode: text(),
	durationMinutes: integer("duration_minutes"),
	comment: text(),
	isPublic: boolean("is_public").default(false).notNull(),
	linkedPlanId: uuid("linked_plan_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "daily_records_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("daily_records_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const memos = pgTable("memos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	recordId: uuid("record_id"),
	profileId: uuid("profile_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "memos_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recordId],
			foreignColumns: [dailyRecords.id],
			name: "memos_record_id_daily_records_id_fk"
		}).onDelete("cascade"),
	pgPolicy("memos_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const profiles = pgTable("profiles", {
	profileId: uuid("profile_id").primaryKey().notNull(),
	avatarUrl: text("avatar_url"),
	fullName: text("full_name").notNull(),
	username: text().notNull(),
	headline: text(),
	bio: text(),
	stats: jsonb(),
	views: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	dailyRecordVisibility: text("daily_record_visibility").default('followers').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [users.id],
			name: "profiles_profile_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userDefaultCodePreferences = pgTable("user_default_code_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	defaultCategoryCode: varchar("default_category_code", { length: 10 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("user_default_pref_profile_code_idx").using("btree", table.profileId.asc().nullsLast().op("text_ops"), table.defaultCategoryCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "user_default_code_preferences_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("user_default_code_preferences_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	participant1Id: uuid("participant1_id").notNull(),
	participant2Id: uuid("participant2_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.participant1Id],
			foreignColumns: [profiles.profileId],
			name: "conversations_participant1_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.participant2Id],
			foreignColumns: [profiles.profileId],
			name: "conversations_participant2_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("conversations_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((auth.uid() = participant1_id) OR (auth.uid() = participant2_id))`, withCheck: sql`((auth.uid() = participant1_id) OR (auth.uid() = participant2_id))`  }),
]);

export const statsCache = pgTable("stats_cache", {
	id: text().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	monthDate: text("month_date").notNull(),
	categoryDistribution: jsonb("category_distribution"),
	activityHeatmap: jsonb("activity_heatmap"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("stats_cache_profile_month_idx").using("btree", table.profileId.asc().nullsLast().op("text_ops"), table.monthDate.asc().nullsLast().op("text_ops")),
	pgPolicy("stats_cache_rls", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = profile_id)` }),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.profileId],
			name: "messages_sender_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("messages_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((auth.uid() = sender_id) OR ( SELECT true
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant1_id = auth.uid()) OR (c.participant2_id = auth.uid())))))`, withCheck: sql`((auth.uid() = sender_id) AND ( SELECT true
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant1_id = auth.uid()) OR (c.participant2_id = auth.uid())))))`  }),
]);

export const dailyPlans = pgTable("daily_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	planDate: date("plan_date").notNull(),
	categoryCode: varchar("category_code", { length: 10 }).notNull(),
	subcode: text(),
	durationMinutes: integer("duration_minutes"),
	comment: text(),
	isCompleted: boolean("is_completed").default(false).notNull(),
	linkedWeeklyTaskId: uuid("linked_weekly_task_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "daily_plans_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("daily_plans_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const monthlyGoals = pgTable("monthly_goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	monthDate: date("month_date").notNull(),
	categoryCode: varchar("category_code", { length: 10 }).notNull(),
	title: text().notNull(),
	description: text(),
	successCriteria: jsonb("success_criteria"),
	weeklyBreakdown: jsonb("weekly_breakdown"),
	isCompleted: boolean("is_completed").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "monthly_goals_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("monthly_goals_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const monthlyReflections = pgTable("monthly_reflections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	monthDate: date("month_date").notNull(),
	monthlyNotes: text("monthly_notes"),
	monthlyReflection: text("monthly_reflection"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("monthly_reflections_profile_month_idx").using("btree", table.profileId.asc().nullsLast().op("date_ops"), table.monthDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "monthly_reflections_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("monthly_reflections_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const weeklyNotes = pgTable("weekly_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	weekStartDate: date("week_start_date").notNull(),
	criticalSuccessFactor: text("critical_success_factor"),
	weeklySee: text("weekly_see"),
	wordsOfPraise: text("words_of_praise"),
	weeklyGoalNote: text("weekly_goal_note"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "weekly_notes_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("weekly_notes_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const weeklyTasks = pgTable("weekly_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	weekStartDate: date("week_start_date").notNull(),
	categoryCode: varchar("category_code", { length: 10 }).notNull(),
	subcode: text(),
	comment: text().notNull(),
	days: jsonb(),
	isLocked: boolean("is_locked").default(false).notNull(),
	fromMonthlyGoalId: uuid("from_monthly_goal_id"),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "weekly_tasks_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("weekly_tasks_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const userCodeSettings = pgTable("user_code_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	enableAutocomplete: boolean("enable_autocomplete").default(true).notNull(),
	enableRecommendation: boolean("enable_recommendation").default(true).notNull(),
	recommendationSource: varchar("recommendation_source", { length: 20 }).default('frequency').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "user_code_settings_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	unique("user_code_settings_profile_id_unique").on(table.profileId),
	pgPolicy("user_code_settings_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const userSubcodes = pgTable("user_subcodes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	parentCategoryCode: varchar("parent_category_code", { length: 10 }).notNull(),
	subcode: text().notNull(),
	description: text(),
	frequencyScore: integer("frequency_score").default(0).notNull(),
	isFavorite: boolean("is_favorite").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "user_subcodes_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("user_subcodes_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const userCategories = pgTable("user_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	code: varchar({ length: 10 }).notNull(),
	label: text().notNull(),
	icon: text(),
	color: varchar({ length: 7 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.profileId],
			name: "user_categories_profile_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("user_categories_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = profile_id)`, withCheck: sql`(auth.uid() = profile_id)`  }),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	recipientId: uuid("recipient_id").notNull(),
	actorId: uuid("actor_id"),
	type: text().notNull(),
	resourceUrl: text("resource_url"),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	message: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [profiles.profileId],
			name: "notifications_actor_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.profileId],
			name: "notifications_recipient_id_profiles_profile_id_fk"
		}).onDelete("cascade"),
	pgPolicy("notifications_rls", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(auth.uid() = recipient_id)`, withCheck: sql`(auth.uid() = recipient_id)`  }),
]);

export const sharedLinks = pgTable("shared_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	token: text().notNull(),
	pageType: text("page_type").notNull(),
	period: text().notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	settings: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("shared_links_profile_page_period_idx").using("btree", table.profileId.asc().nullsLast().op("uuid_ops"), table.pageType.asc().nullsLast().op("text_ops"), table.period.asc().nullsLast().op("uuid_ops")),
	unique("shared_links_token_unique").on(table.token),
]);
