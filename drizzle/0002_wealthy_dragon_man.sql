CREATE TYPE "public"."guest_purchase_status" AS ENUM('pending', 'paid', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."livestream_status" AS ENUM('idle', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."sub_status" AS ENUM('trial', 'active', 'grace', 'expired');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "guest_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_once_link_id" uuid NOT NULL,
	"phone_number" text NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_token" text NOT NULL,
	"ip_address" text,
	"ntzs_guest_user_id" text,
	"status" "guest_purchase_status" DEFAULT 'pending' NOT NULL,
	"amount_tzs" integer NOT NULL,
	"transfer_id" text,
	"deposit_id" text,
	"expires_at" timestamp,
	"watched" boolean DEFAULT false NOT NULL,
	"converted_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_purchases_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'entertainment' NOT NULL,
	"status" "livestream_status" DEFAULT 'idle' NOT NULL,
	"price_tzs" integer DEFAULT 0 NOT NULL,
	"thumbnail_url" text,
	"cf_stream_input_id" text,
	"cf_stream_input_uid" text,
	"rtmp_url" text,
	"rtmp_key" text,
	"srt_url" text,
	"cf_playback_url" text,
	"cf_webrtc_url" text,
	"viewer_count" integer DEFAULT 0,
	"peak_viewer_count" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"recording_enabled" boolean DEFAULT true NOT NULL,
	"cf_recording_video_id" text,
	"vod_content_id" uuid,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" "sub_status" DEFAULT 'trial' NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"grace_ends_at" timestamp,
	"trial_used" boolean DEFAULT false NOT NULL,
	"payment_intent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"cover_image_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_once_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"content_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"price_tzs" integer NOT NULL,
	"teaser_seconds" integer DEFAULT 10 NOT NULL,
	"max_purchases" integer,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "view_once_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ntzs_user_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ntzs_wallet_address" text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_purchases" ADD CONSTRAINT "guest_purchases_view_once_link_id_view_once_links_id_fk" FOREIGN KEY ("view_once_link_id") REFERENCES "public"."view_once_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_vod_content_id_content_id_fk" FOREIGN KEY ("vod_content_id") REFERENCES "public"."content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_subscriptions" ADD CONSTRAINT "platform_subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_once_links" ADD CONSTRAINT "view_once_links_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_once_links" ADD CONSTRAINT "view_once_links_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_purchases_session_token_idx" ON "guest_purchases" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "guest_purchases_link_id_idx" ON "guest_purchases" USING btree ("view_once_link_id");--> statement-breakpoint
CREATE INDEX "guest_purchases_phone_idx" ON "guest_purchases" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "guest_purchases_status_idx" ON "guest_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "livestreams_creator_id_idx" ON "livestreams" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "livestreams_status_idx" ON "livestreams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "livestreams_scheduled_at_idx" ON "livestreams" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "platform_sub_profile_id_idx" ON "platform_subscriptions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "platform_sub_status_idx" ON "platform_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_sub_expires_at_idx" ON "platform_subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "playlist_items_playlist_id_idx" ON "playlist_items" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "playlist_items_content_id_idx" ON "playlist_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "playlist_items_position_idx" ON "playlist_items" USING btree ("playlist_id","position");--> statement-breakpoint
CREATE INDEX "playlists_creator_id_idx" ON "playlists" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "playlists_published_idx" ON "playlists" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "view_once_links_slug_idx" ON "view_once_links" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "view_once_links_creator_id_idx" ON "view_once_links" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "view_once_links_content_id_idx" ON "view_once_links" USING btree ("content_id");