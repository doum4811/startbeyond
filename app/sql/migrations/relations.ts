import { relations } from "drizzle-orm/relations";
import { profiles, communityPosts, communityComments, follows, dailyNotes, dailyRecords, memos, usersInAuth, userDefaultCodePreferences, conversations, messages, dailyPlans, monthlyGoals, monthlyReflections, weeklyNotes, weeklyTasks, userCodeSettings, userSubcodes, userCategories, notifications } from "./schema";

export const communityPostsRelations = relations(communityPosts, ({one, many}) => ({
	profile: one(profiles, {
		fields: [communityPosts.profileId],
		references: [profiles.profileId]
	}),
	communityComments: many(communityComments),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	communityPosts: many(communityPosts),
	communityComments: many(communityComments),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_profiles_profileId"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_profiles_profileId"
	}),
	dailyNotes: many(dailyNotes),
	dailyRecords: many(dailyRecords),
	memos: many(memos),
	usersInAuth: one(usersInAuth, {
		fields: [profiles.profileId],
		references: [usersInAuth.id]
	}),
	userDefaultCodePreferences: many(userDefaultCodePreferences),
	conversations_participant1Id: many(conversations, {
		relationName: "conversations_participant1Id_profiles_profileId"
	}),
	conversations_participant2Id: many(conversations, {
		relationName: "conversations_participant2Id_profiles_profileId"
	}),
	messages: many(messages),
	dailyPlans: many(dailyPlans),
	monthlyGoals: many(monthlyGoals),
	monthlyReflections: many(monthlyReflections),
	weeklyNotes: many(weeklyNotes),
	weeklyTasks: many(weeklyTasks),
	userCodeSettings: many(userCodeSettings),
	userSubcodes: many(userSubcodes),
	userCategories: many(userCategories),
	notifications_actorId: many(notifications, {
		relationName: "notifications_actorId_profiles_profileId"
	}),
	notifications_recipientId: many(notifications, {
		relationName: "notifications_recipientId_profiles_profileId"
	}),
}));

export const communityCommentsRelations = relations(communityComments, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [communityComments.postId],
		references: [communityPosts.id]
	}),
	profile: one(profiles, {
		fields: [communityComments.profileId],
		references: [profiles.profileId]
	}),
}));

export const followsRelations = relations(follows, ({one}) => ({
	profile_followerId: one(profiles, {
		fields: [follows.followerId],
		references: [profiles.profileId],
		relationName: "follows_followerId_profiles_profileId"
	}),
	profile_followingId: one(profiles, {
		fields: [follows.followingId],
		references: [profiles.profileId],
		relationName: "follows_followingId_profiles_profileId"
	}),
}));

export const dailyNotesRelations = relations(dailyNotes, ({one}) => ({
	profile: one(profiles, {
		fields: [dailyNotes.profileId],
		references: [profiles.profileId]
	}),
}));

export const dailyRecordsRelations = relations(dailyRecords, ({one, many}) => ({
	profile: one(profiles, {
		fields: [dailyRecords.profileId],
		references: [profiles.profileId]
	}),
	memos: many(memos),
}));

export const memosRelations = relations(memos, ({one}) => ({
	profile: one(profiles, {
		fields: [memos.profileId],
		references: [profiles.profileId]
	}),
	dailyRecord: one(dailyRecords, {
		fields: [memos.recordId],
		references: [dailyRecords.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	profiles: many(profiles),
}));

export const userDefaultCodePreferencesRelations = relations(userDefaultCodePreferences, ({one}) => ({
	profile: one(profiles, {
		fields: [userDefaultCodePreferences.profileId],
		references: [profiles.profileId]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	profile_participant1Id: one(profiles, {
		fields: [conversations.participant1Id],
		references: [profiles.profileId],
		relationName: "conversations_participant1Id_profiles_profileId"
	}),
	profile_participant2Id: one(profiles, {
		fields: [conversations.participant2Id],
		references: [profiles.profileId],
		relationName: "conversations_participant2Id_profiles_profileId"
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	profile: one(profiles, {
		fields: [messages.senderId],
		references: [profiles.profileId]
	}),
}));

export const dailyPlansRelations = relations(dailyPlans, ({one}) => ({
	profile: one(profiles, {
		fields: [dailyPlans.profileId],
		references: [profiles.profileId]
	}),
}));

export const monthlyGoalsRelations = relations(monthlyGoals, ({one}) => ({
	profile: one(profiles, {
		fields: [monthlyGoals.profileId],
		references: [profiles.profileId]
	}),
}));

export const monthlyReflectionsRelations = relations(monthlyReflections, ({one}) => ({
	profile: one(profiles, {
		fields: [monthlyReflections.profileId],
		references: [profiles.profileId]
	}),
}));

export const weeklyNotesRelations = relations(weeklyNotes, ({one}) => ({
	profile: one(profiles, {
		fields: [weeklyNotes.profileId],
		references: [profiles.profileId]
	}),
}));

export const weeklyTasksRelations = relations(weeklyTasks, ({one}) => ({
	profile: one(profiles, {
		fields: [weeklyTasks.profileId],
		references: [profiles.profileId]
	}),
}));

export const userCodeSettingsRelations = relations(userCodeSettings, ({one}) => ({
	profile: one(profiles, {
		fields: [userCodeSettings.profileId],
		references: [profiles.profileId]
	}),
}));

export const userSubcodesRelations = relations(userSubcodes, ({one}) => ({
	profile: one(profiles, {
		fields: [userSubcodes.profileId],
		references: [profiles.profileId]
	}),
}));

export const userCategoriesRelations = relations(userCategories, ({one}) => ({
	profile: one(profiles, {
		fields: [userCategories.profileId],
		references: [profiles.profileId]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	profile_actorId: one(profiles, {
		fields: [notifications.actorId],
		references: [profiles.profileId],
		relationName: "notifications_actorId_profiles_profileId"
	}),
	profile_recipientId: one(profiles, {
		fields: [notifications.recipientId],
		references: [profiles.profileId],
		relationName: "notifications_recipientId_profiles_profileId"
	}),
}));