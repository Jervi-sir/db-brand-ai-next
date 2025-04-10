import { relations } from "drizzle-orm/relations";
import { user, suggestion, document, chat, message, openAiApiUsage, subscriptionPlan, subscriptionModel, aiModel, vote, userSubscription } from "./schema";

export const suggestionRelations = relations(suggestion, ({one}) => ({
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	suggestions: many(suggestion),
	chats: many(chat),
	userSubscriptions: many(userSubscription),
	documents: many(document),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	suggestions: many(suggestion),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	messages: many(message),
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	openAiApiUsages: many(openAiApiUsage),
	votes: many(vote),
}));

export const openAiApiUsageRelations = relations(openAiApiUsage, ({one}) => ({
	chat: one(chat, {
		fields: [openAiApiUsage.chatId],
		references: [chat.id]
	}),
}));

export const subscriptionModelRelations = relations(subscriptionModel, ({one}) => ({
	subscriptionPlan: one(subscriptionPlan, {
		fields: [subscriptionModel.subscriptionPlanId],
		references: [subscriptionPlan.id]
	}),
	aiModel: one(aiModel, {
		fields: [subscriptionModel.aiModelId],
		references: [aiModel.id]
	}),
}));

export const subscriptionPlanRelations = relations(subscriptionPlan, ({many}) => ({
	subscriptionModels: many(subscriptionModel),
	userSubscriptions: many(userSubscription),
}));

export const aiModelRelations = relations(aiModel, ({many}) => ({
	subscriptionModels: many(subscriptionModel),
}));

export const voteRelations = relations(vote, ({one}) => ({
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
}));

export const userSubscriptionRelations = relations(userSubscription, ({one}) => ({
	user: one(user, {
		fields: [userSubscription.userId],
		references: [user.id]
	}),
	subscriptionPlan: one(subscriptionPlan, {
		fields: [userSubscription.subscriptionPlanId],
		references: [subscriptionPlan.id]
	}),
}));