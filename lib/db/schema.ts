import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar, timestamp, json, uuid, text, primaryKey, foreignKey, boolean, integer, real, decimal, } from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  role: text('role').default('user'), // Ensure this exists
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  passwordPlainText: varchar('passwordPlainText', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title'),
  userId: uuid('userId') .notNull() .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] }).notNull().default('private'),
  capability: text('capability'), // Free-text, e.g., "copywriting"

  threadId: varchar('threadId', { length: 64 }), // Nullable
  deletedAt: timestamp('deletedAt'), // Nullable


});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId').notNull().references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),

  model: varchar('model', { length: 64 }).default('gpt-4o-mini'),
  promptTokens: integer('promptTokens'), // Nullable
  completionTokens: integer('completionTokens'), // Nullable
  totalTokens: integer('totalTokens'), // Nullable
  duration: decimal('duration'), // Nullable float-like
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;


/*
|--------------------------------------------------------------------------
| Tracking
|--------------------------------------------------------------------------
*/
export const openAiApiUsage = pgTable('OpenAiApiUsage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId').notNull().references(() => chat.id),
  model: varchar('model', { length: 64 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  promptTokens: integer('promptTokens').notNull(),
  completionTokens: integer('completionTokens').notNull(),
  totalTokens: integer('totalTokens').notNull(),
  duration: decimal('duration'),
  completedAt: timestamp('completedAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type OpenAiApiUsage = InferSelectModel<typeof openAiApiUsage>;


/*
|--------------------------------------------------------------------------
| added
|--------------------------------------------------------------------------
*/
export const subscriptionPlan = pgTable('SubscriptionPlan', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 64 }).notNull(), // e.g., "Copywriting", "Calendar"
  capabilities: text('capabilities').notNull(), // Free-text, e.g., "copywriting" or "copywriting,calendar"
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type SubscriptionPlan = InferSelectModel<typeof subscriptionPlan>;

export const userSubscription = pgTable(
  'UserSubscription',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }), // Explicitly define behavior
    subscriptionPlanId: uuid('subscriptionPlanId')
      .notNull()
      .references(() => subscriptionPlan.id, { onDelete: 'cascade' }),
    subscribedAt: timestamp('subscribedAt').notNull().defaultNow(),
    isActive: boolean('isActive').notNull().default(true),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.subscriptionPlanId] }),
  }),
);

export type UserSubscription = InferSelectModel<typeof userSubscription>;

export const aiModel = pgTable('AIModel', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 64 }).notNull(), // e.g., "Copywriting AI"
  endpoint: varchar('endpoint', { length: 256 }).notNull(),
  apiKey: varchar('apiKey', { length: 128 }),
  capability: text('capability').notNull(), // Free-text, e.g., "copywriting"
  createdAt: timestamp('createdAt').notNull().defaultNow(),

  provider: varchar('provider', { length: 64 }).notNull().default('openai'),
  displayName: varchar('displayName', { length: 64 }),
  type: varchar('type', { length: 64 }),
  isActive: boolean('isActive').notNull().default(true),
  maxTokens: integer('maxTokens'), // Nullable
  temperature: integer('temperature'), // Nullable

  customPrompts: text('customPrompts'), // Nullable

});

export type AIModel = InferSelectModel<typeof aiModel>;

export const subscriptionModel = pgTable(
  'SubscriptionModel',
  {
    subscriptionPlanId: uuid('subscriptionPlanId')
      .notNull()
      .references(() => subscriptionPlan.id),
    aiModelId: uuid('aiModelId')
      .notNull()
      .references(() => aiModel.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.subscriptionPlanId, table.aiModelId] }),
  }),
);

export type SubscriptionModel = InferSelectModel<typeof subscriptionModel>;


