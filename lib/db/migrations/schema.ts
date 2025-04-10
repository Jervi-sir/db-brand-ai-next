import { pgTable, foreignKey, uuid, timestamp, text, boolean, varchar, json, integer, numeric, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const suggestion = pgTable("Suggestion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid().notNull(),
	documentCreatedAt: timestamp({ mode: 'string' }).notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtF: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
	}
});

export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
	role: text().default('user'),
	passwordPlainText: varchar({ length: 64 }),
});

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	content: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	model: varchar({ length: 64 }).default('gpt-4o-mini'),
	promptTokens: integer(),
	completionTokens: integer(),
	totalTokens: integer(),
	duration: numeric(),
	annotations: json(),
},
(table) => {
	return {
		messageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}),
	}
});

export const subscriptionPlan = pgTable("SubscriptionPlan", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 64 }).notNull(),
	capabilities: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const aiModel = pgTable("AIModel", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 64 }).notNull(),
	endpoint: varchar({ length: 256 }).notNull(),
	apiKey: varchar({ length: 128 }),
	capability: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	provider: varchar({ length: 64 }).default('openai').notNull(),
	displayName: varchar({ length: 64 }),
	type: varchar({ length: 64 }),
	isActive: boolean().default(true).notNull(),
	maxTokens: integer(),
	temperature: integer(),
	customPrompts: text(),
});

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	userId: uuid().notNull(),
	title: text(),
	visibility: varchar().default('private').notNull(),
	capability: text(),
	threadId: varchar({ length: 64 }),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
	}
});

export const openAiApiUsage = pgTable("OpenAiApiUsage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	model: varchar({ length: 64 }).notNull(),
	type: varchar({ length: 64 }).notNull(),
	promptTokens: integer().notNull(),
	completionTokens: integer().notNull(),
	totalTokens: integer().notNull(),
	duration: numeric(),
	completedAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		openAiApiUsageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "OpenAiApiUsage_chatId_Chat_id_fk"
		}),
	}
});

export const subscriptionModel = pgTable("SubscriptionModel", {
	subscriptionPlanId: uuid().notNull(),
	aiModelId: uuid().notNull(),
},
(table) => {
	return {
		subscriptionModelSubscriptionPlanIdSubscriptionPlanIdFk: foreignKey({
			columns: [table.subscriptionPlanId],
			foreignColumns: [subscriptionPlan.id],
			name: "SubscriptionModel_subscriptionPlanId_SubscriptionPlan_id_fk"
		}),
		subscriptionModelAiModelIdAiModelIdFk: foreignKey({
			columns: [table.aiModelId],
			foreignColumns: [aiModel.id],
			name: "SubscriptionModel_aiModelId_AIModel_id_fk"
		}),
		subscriptionModelSubscriptionPlanIdAiModelIdPk: primaryKey({ columns: [table.subscriptionPlanId, table.aiModelId], name: "SubscriptionModel_subscriptionPlanId_aiModelId_pk"}),
	}
});

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}),
		voteMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}),
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
	}
});

export const userSubscription = pgTable("UserSubscription", {
	userId: uuid().notNull(),
	subscriptionPlanId: uuid().notNull(),
	subscribedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	isActive: boolean().default(true).notNull(),
},
(table) => {
	return {
		userSubscriptionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserSubscription_userId_User_id_fk"
		}).onDelete("cascade"),
		userSubscriptionSubscriptionPlanIdSubscriptionPlanIdFk: foreignKey({
			columns: [table.subscriptionPlanId],
			foreignColumns: [subscriptionPlan.id],
			name: "UserSubscription_subscriptionPlanId_SubscriptionPlan_id_fk"
		}).onDelete("cascade"),
		userSubscriptionUserIdSubscriptionPlanIdPk: primaryKey({ columns: [table.userId, table.subscriptionPlanId], name: "UserSubscription_userId_subscriptionPlanId_pk"}),
	}
});

export const document = pgTable("Document", {
	id: uuid().defaultRandom().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	userId: uuid().notNull(),
	text: varchar().default('text').notNull(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
		documentIdCreatedAtPk: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"}),
	}
});