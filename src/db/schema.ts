import { pgTable, text, timestamp, integer, boolean, pgEnum, uuid, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['creator', 'fan']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);
export const contentTypeEnum = pgEnum('content_type', ['youtube_preview', 'upload']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const walletTxTypeEnum = pgEnum('wallet_tx_type', ['earning', 'withdrawal', 'fee', 'refund', 'adjustment']);
export const walletTxStatusEnum = pgEnum('wallet_tx_status', ['pending', 'completed', 'failed']);
export const subStatusEnum = pgEnum('sub_status', ['trial', 'active', 'grace', 'expired']);

// Profiles table (extends neon_auth.user)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(), // References neon_auth.user.id
  role: userRoleEnum('role').notNull().default('fan'),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  ntzsUserId: text('ntzs_user_id'), // nTZS WaaS user ID for wallet
  ntzsWalletAddress: text('ntzs_wallet_address'), // On-chain wallet address
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  handleIdx: index('profiles_handle_idx').on(table.handle),
  userIdIdx: index('profiles_user_id_idx').on(table.userId),
}));

// Creator profiles (additional info for creators)
export const creatorProfiles = pgTable('creator_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  verificationStatus: text('verification_status').default('unverified'), // unverified, pending, verified
  payoutPhone: text('payout_phone'), // Mobile money number for payouts
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  profileIdIdx: index('creator_profiles_profile_id_idx').on(table.profileId),
}));

// Content table
export const content = pgTable('content', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // music, comedy, education, etc.
  status: contentStatusEnum('status').notNull().default('draft'),
  contentType: contentTypeEnum('content_type').notNull(),
  priceTzs: integer('price_tzs').notNull(), // Price in Tanzanian Shillings
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  creatorIdIdx: index('content_creator_id_idx').on(table.creatorId),
  statusIdx: index('content_status_idx').on(table.status),
  categoryIdx: index('content_category_idx').on(table.category),
  publishedAtIdx: index('content_published_at_idx').on(table.publishedAt),
}));

// Content media (YouTube URLs or upload storage keys)
export const contentMedia = pgTable('content_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(), // 'youtube', 'video', 'thumbnail'
  url: text('url'), // YouTube URL or CDN URL
  storageKey: text('storage_key'), // For uploaded files (S3/R2 key)
  duration: integer('duration'), // Video duration in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  contentIdIdx: index('content_media_content_id_idx').on(table.contentId),
}));

// Payment intents (tracks payment flow)
export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  amountTzs: integer('amount_tzs').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  provider: text('provider'), // 'selcom', 'dpo', 'flutterwave', etc.
  providerReference: text('provider_reference'), // External payment reference
  phoneNumber: text('phone_number'), // User's mobile money number
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  paidAt: timestamp('paid_at'),
}, (table) => ({
  userIdIdx: index('payment_intents_user_id_idx').on(table.userId),
  contentIdIdx: index('payment_intents_content_id_idx').on(table.contentId),
  statusIdx: index('payment_intents_status_idx').on(table.status),
  providerRefIdx: index('payment_intents_provider_ref_idx').on(table.providerReference),
}));

// Entitlements (access grants after payment)
export const entitlements = pgTable('entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  paymentIntentId: uuid('payment_intent_id').references(() => paymentIntents.id),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}, (table) => ({
  userContentIdx: index('entitlements_user_content_idx').on(table.userId, table.contentId),
  contentIdIdx: index('entitlements_content_id_idx').on(table.contentId),
}));

// Follows (fan follows creator)
export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerCreatorIdx: index('follows_follower_creator_idx').on(table.followerId, table.creatorId),
}));

// Likes
export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userContentIdx: index('likes_user_content_idx').on(table.userId, table.contentId),
}));

// Comments
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  contentIdIdx: index('comments_content_id_idx').on(table.contentId),
  createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
}));

// Playlists / Series
export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  coverImageUrl: text('cover_image_url'),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  creatorIdIdx: index('playlists_creator_id_idx').on(table.creatorId),
  publishedIdx: index('playlists_published_idx').on(table.isPublished),
}));

export const playlistItems = pgTable('playlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(), // Order within the playlist
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  playlistIdIdx: index('playlist_items_playlist_id_idx').on(table.playlistId),
  contentIdIdx: index('playlist_items_content_id_idx').on(table.contentId),
  positionIdx: index('playlist_items_position_idx').on(table.playlistId, table.position),
}));

// Creator wallets (custodial balance)
export const creatorWallets = pgTable('creator_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0), // Current balance in TZS
  totalEarned: integer('total_earned').notNull().default(0),
  totalWithdrawn: integer('total_withdrawn').notNull().default(0),
  totalFees: integer('total_fees').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  creatorIdIdx: index('creator_wallets_creator_id_idx').on(table.creatorId),
}));

// Wallet transactions (immutable ledger)
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => creatorWallets.id, { onDelete: 'cascade' }),
  type: walletTxTypeEnum('type').notNull(),
  status: walletTxStatusEnum('status').notNull().default('completed'),
  amount: integer('amount').notNull(), // Positive = credit, negative = debit
  balanceAfter: integer('balance_after').notNull(), // Snapshot of wallet balance after this tx
  description: text('description'),
  referenceType: text('reference_type'), // 'payment_intent', 'payout', 'manual'
  referenceId: uuid('reference_id'), // ID of the related record
  metadata: text('metadata'), // JSON string for extra data (phone number, provider ref, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletIdIdx: index('wallet_tx_wallet_id_idx').on(table.walletId),
  typeIdx: index('wallet_tx_type_idx').on(table.type),
  statusIdx: index('wallet_tx_status_idx').on(table.status),
  createdAtIdx: index('wallet_tx_created_at_idx').on(table.createdAt),
}));

// Platform subscriptions (weekly access pass)
export const platformSubscriptions = pgTable('platform_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: subStatusEnum('status').notNull().default('trial'),
  startsAt: timestamp('starts_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  graceEndsAt: timestamp('grace_ends_at'), // 2 days after expiresAt
  trialUsed: boolean('trial_used').notNull().default(false),
  paymentIntentId: text('payment_intent_id'), // Snippe reference for the latest payment
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  profileIdIdx: index('platform_sub_profile_id_idx').on(table.profileId),
  statusIdx: index('platform_sub_status_idx').on(table.status),
  expiresAtIdx: index('platform_sub_expires_at_idx').on(table.expiresAt),
}));

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  creatorProfile: one(creatorProfiles, {
    fields: [profiles.id],
    references: [creatorProfiles.profileId],
  }),
  wallet: one(creatorWallets, {
    fields: [profiles.id],
    references: [creatorWallets.creatorId],
  }),
  subscription: one(platformSubscriptions, {
    fields: [profiles.id],
    references: [platformSubscriptions.profileId],
  }),
  content: many(content),
  paymentIntents: many(paymentIntents),
  entitlements: many(entitlements),
  following: many(follows, { relationName: 'follower' }),
  followers: many(follows, { relationName: 'creator' }),
  likes: many(likes),
  comments: many(comments),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [content.creatorId],
    references: [profiles.id],
  }),
  media: many(contentMedia),
  paymentIntents: many(paymentIntents),
  entitlements: many(entitlements),
  likes: many(likes),
  comments: many(comments),
  playlistItems: many(playlistItems),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  user: one(profiles, {
    fields: [entitlements.userId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [entitlements.contentId],
    references: [content.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [entitlements.paymentIntentId],
    references: [paymentIntents.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: 'follower',
  }),
  creator: one(profiles, {
    fields: [follows.creatorId],
    references: [profiles.id],
    relationName: 'creator',
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(profiles, {
    fields: [likes.userId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [likes.contentId],
    references: [content.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [comments.contentId],
    references: [content.id],
  }),
}));

export const contentMediaRelations = relations(contentMedia, ({ one }) => ({
  content: one(content, {
    fields: [contentMedia.contentId],
    references: [content.id],
  }),
}));

export const creatorProfilesRelations = relations(creatorProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [creatorProfiles.profileId],
    references: [profiles.id],
  }),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  user: one(profiles, {
    fields: [paymentIntents.userId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [paymentIntents.contentId],
    references: [content.id],
  }),
}));

export const creatorWalletsRelations = relations(creatorWallets, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [creatorWallets.creatorId],
    references: [profiles.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(creatorWallets, {
    fields: [walletTransactions.walletId],
    references: [creatorWallets.id],
  }),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [playlists.creatorId],
    references: [profiles.id],
  }),
  items: many(playlistItems),
}));

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  content: one(content, {
    fields: [playlistItems.contentId],
    references: [content.id],
  }),
}));

export const platformSubscriptionsRelations = relations(platformSubscriptions, ({ one }) => ({
  profile: one(profiles, {
    fields: [platformSubscriptions.profileId],
    references: [profiles.id],
  }),
}));
