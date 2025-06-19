import { relations } from "drizzle-orm/relations";
import { profiles, userCategories, userSubcodes, userCodeSettings, userDefaultCodePreferences, sharedLinks, statsCache, dailyRecords, dailyNotes, memos, conversations, messages, communityPosts, communityComments, notifications, dailyPlans, weeklyTasks, weeklyNotes, monthlyGoals, monthlyReflections, follows } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	userCategories: many(userCategories),
	userSubcodes: many(userSubcodes),
	userCodeSettings: many(userCodeSettings),
	userDefaultCodePreferences: many(userDefaultCodePreferences),
	sharedLinks: many(sharedLinks),
	statsCaches: many(statsCache),
	dailyRecords: many(dailyRecords),
	dailyNotes: many(dailyNotes),
	memos: many(memos),
	conversations_participant1Id: many(conversations, {
		relationName: "conversations_participant1Id_profiles_profileId"
	}),
	conversations_participant2Id: many(conversations, {
		relationName: "conversations_participant2Id_profiles_profileId"
	}),
	messages: many(messages),
	communityPosts: many(communityPosts),
	communityComments: many(communityComments),
	notifications_actorId: many(notifications, {
		relationName: "notifications_actorId_profiles_profileId"
	}),
	notifications_recipientId: many(notifications, {
		relationName: "notifications_recipientId_profiles_profileId"
	}),
	dailyPlans: many(dailyPlans),
	weeklyTasks: many(weeklyTasks),
	weeklyNotes: many(weeklyNotes),
	monthlyGoals: many(monthlyGoals),
	monthlyReflections: many(monthlyReflections),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_profiles_profileId"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_profiles_profileId"
	}),
}));

export const userCategoriesRelations = relations(userCategories, ({one}) => ({
	profile: one(profiles, {
		fields: [userCategories.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const userSubcodesRelations = relations(userSubcodes, ({one}) => ({
	profile: one(profiles, {
		fields: [userSubcodes.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const userCodeSettingsRelations = relations(userCodeSettings, ({one}) => ({
	profile: one(profiles, {
		fields: [userCodeSettings.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const userDefaultCodePreferencesRelations = relations(userDefaultCodePreferences, ({one}) => ({
	profile: one(profiles, {
		fields: [userDefaultCodePreferences.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const sharedLinksRelations = relations(sharedLinks, ({one}) => ({
	profile: one(profiles, {
		fields: [sharedLinks.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const statsCacheRelations = relations(statsCache, ({one}) => ({
	profile: one(profiles, {
		fields: [statsCache.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const dailyRecordsRelations = relations(dailyRecords, ({one, many}) => ({
	profile: one(profiles, {
		fields: [dailyRecords.profile_id],
		references: [profiles.profile_id]
	}),
	memos: many(memos),
}));

export const dailyNotesRelations = relations(dailyNotes, ({one}) => ({
	profile: one(profiles, {
		fields: [dailyNotes.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const memosRelations = relations(memos, ({one}) => ({
	profile: one(profiles, {
		fields: [memos.profile_id],
		references: [profiles.profile_id]
	}),
	dailyRecord: one(dailyRecords, {
		fields: [memos.record_id],
		references: [dailyRecords.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	profile_participant1Id: one(profiles, {
		fields: [conversations.participant1_id],
		references: [profiles.profile_id],
		relationName: "conversations_participant1Id_profiles_profileId"
	}),
	profile_participant2Id: one(profiles, {
		fields: [conversations.participant2_id],
		references: [profiles.profile_id],
		relationName: "conversations_participant2Id_profiles_profileId"
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversation_id],
		references: [conversations.id]
	}),
	profile: one(profiles, {
		fields: [messages.sender_id],
		references: [profiles.profile_id]
	}),
}));

export const communityPostsRelations = relations(communityPosts, ({one, many}) => ({
	profile: one(profiles, {
		fields: [communityPosts.profile_id],
		references: [profiles.profile_id]
	}),
	communityComments: many(communityComments),
}));

export const communityCommentsRelations = relations(communityComments, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [communityComments.post_id],
		references: [communityPosts.id]
	}),
	profile: one(profiles, {
		fields: [communityComments.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	profile_actorId: one(profiles, {
		fields: [notifications.actor_id],
		references: [profiles.profile_id],
		relationName: "notifications_actorId_profiles_profileId"
	}),
	profile_recipientId: one(profiles, {
		fields: [notifications.recipient_id],
		references: [profiles.profile_id],
		relationName: "notifications_recipientId_profiles_profileId"
	}),
}));

export const dailyPlansRelations = relations(dailyPlans, ({one}) => ({
	profile: one(profiles, {
		fields: [dailyPlans.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const weeklyTasksRelations = relations(weeklyTasks, ({one}) => ({
	profile: one(profiles, {
		fields: [weeklyTasks.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const weeklyNotesRelations = relations(weeklyNotes, ({one}) => ({
	profile: one(profiles, {
		fields: [weeklyNotes.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const monthlyGoalsRelations = relations(monthlyGoals, ({one}) => ({
	profile: one(profiles, {
		fields: [monthlyGoals.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const monthlyReflectionsRelations = relations(monthlyReflections, ({one}) => ({
	profile: one(profiles, {
		fields: [monthlyReflections.profile_id],
		references: [profiles.profile_id]
	}),
}));

export const followsRelations = relations(follows, ({one}) => ({
	profile_followerId: one(profiles, {
		fields: [follows.follower_id],
		references: [profiles.profile_id],
		relationName: "follows_followerId_profiles_profileId"
	}),
	profile_followingId: one(profiles, {
		fields: [follows.following_id],
		references: [profiles.profile_id],
		relationName: "follows_followingId_profiles_profileId"
	}),
}));