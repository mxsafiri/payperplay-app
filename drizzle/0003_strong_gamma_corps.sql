CREATE TABLE "live_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestream_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"message" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_creator" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestream_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestream_id" uuid NOT NULL,
	"user_id" uuid,
	"phone_number" text,
	"amount_tzs" integer NOT NULL,
	"status" "guest_purchase_status" DEFAULT 'pending' NOT NULL,
	"deposit_id" text,
	"transfer_id" text,
	"ntzs_guest_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "livestreams" ADD COLUMN "webrtc_publish_url" text;--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_access" ADD CONSTRAINT "livestream_access_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_access" ADD CONSTRAINT "livestream_access_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "live_chat_livestream_idx" ON "live_chat_messages" USING btree ("livestream_id");--> statement-breakpoint
CREATE INDEX "live_chat_created_at_idx" ON "live_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "livestream_access_livestream_idx" ON "livestream_access" USING btree ("livestream_id");--> statement-breakpoint
CREATE INDEX "livestream_access_user_idx" ON "livestream_access" USING btree ("user_id");