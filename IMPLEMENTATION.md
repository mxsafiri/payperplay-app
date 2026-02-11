# PayPerPlay Implementation Progress

## ✅ Phase 1: Foundation (COMPLETED)

### Database & Auth Setup
- **Neon PostgreSQL** connected and configured
- **Neon Auth** (Better Auth) provisioned and integrated
- **Drizzle ORM** installed and configured
- Database schema created with 9 tables:
  - `profiles` - User profiles with role (creator/fan)
  - `creator_profiles` - Additional creator info (verification, payouts)
  - `content` - Content items with pricing
  - `content_media` - YouTube URLs or upload storage keys
  - `payment_intents` - Payment tracking
  - `entitlements` - Access grants after payment
  - `follows` - Fan follows creator
  - `likes` - Content likes
  - `comments` - Content comments

### Authentication
- ✅ Login page (`/login`)
- ✅ Signup page with 3-step flow (`/signup`):
  1. Account creation (email/password)
  2. Role selection (creator vs fan)
  3. Profile setup (username/handle)
- ✅ Session management via Better Auth
- ✅ Profile creation API (`/api/profile/create`)

### Payment System
- ✅ Generic payment abstraction layer
- ✅ Base provider interface for Tanzania PSPs
- ✅ Mock provider for testing
- ✅ Phone number validation (Tanzania format)
- ✅ Payment initiation API (`/api/payments/initiate`)
- ✅ Payment callback/webhook handler (`/api/payments/callback`)
- ✅ Payment status polling endpoint (`/api/payments/status/[id]`)
- ✅ Idempotent entitlement granting

## 🚧 Phase 2: Creator Flows (IN PROGRESS)

### To Build Next
- [ ] Creator dashboard (`/creator/dashboard`)
- [ ] Content creation form (`/creator/content/new`)
- [ ] Content management (`/creator/content/[id]/edit`)
- [ ] Creator public profile (`/creators/[handle]`)

## 📋 Phase 3: Fan Flows (PENDING)

- [ ] Discovery feed (replace `/dashboard` mock data)
- [ ] Content detail page (`/content/[id]`)
- [ ] Paywall UI with payment flow
- [ ] Fan library (`/library`)
- [ ] Following page (`/following`)

## 📋 Phase 4: Social Features (PENDING)

- [ ] Follow/unfollow functionality
- [ ] Like/unlike content
- [ ] Comment system
- [ ] Notifications (optional)

---

## Environment Variables Required

Add to `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_QNrW2hDFR8Py@ep-silent-waterfall-agrb41pa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payment Provider (currently using mock)
PAYMENT_PROVIDER=mock
PAYMENT_API_KEY=
PAYMENT_API_SECRET=
PAYMENT_WEBHOOK_SECRET=
PAYMENT_ENVIRONMENT=sandbox

# OAuth (optional - for Google/GitHub login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## Payment Provider Integration Guide

### Current Setup
Using **MockPaymentProvider** for testing. To integrate a real Tanzania PSP:

### Supported PSPs (Examples)
1. **Selcom** - Tanzania-focused, good mobile money support
2. **DPO** - Pan-African
3. **Flutterwave** - Has Tanzania operations

### Integration Steps

1. Create provider class in `src/lib/payments/providers/`:

```typescript
// Example: selcom-provider.ts
import { BasePaymentProvider } from '../base-provider';

export class SelcomPaymentProvider extends BasePaymentProvider {
  get name(): string {
    return 'selcom';
  }

  async initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResponse> {
    const response = await fetch('https://api.selcommobile.com/v1/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor: 'YOURVENDOR',
        order_id: params.reference,
        amount: params.amount,
        currency: params.currency,
        buyer_phone: this.normalizePhoneNumber(params.phoneNumber),
        webhook: this.config.callbackUrl,
      }),
    });
    
    const data = await response.json();
    
    return {
      success: data.result === 'SUCCESS',
      providerReference: data.transid,
      instructions: 'Check your phone for payment prompt',
    };
  }

  verifyCallback(payload: unknown): PaymentCallbackResult {
    // Verify webhook signature
    // Parse Selcom callback format
    // Return standardized result
  }

  async checkStatus(providerReference: string): Promise<PaymentStatusResponse> {
    // Query Selcom API for status
  }
}
```

2. Register in `src/lib/payments/index.ts`:

```typescript
import { SelcomPaymentProvider } from './providers/selcom-provider';

export function createPaymentProvider(config: PaymentConfig): PaymentProvider {
  switch (config.provider.toLowerCase()) {
    case 'selcom':
      return new SelcomPaymentProvider(config);
    // ... other providers
  }
}
```

3. Update environment variables:

```bash
PAYMENT_PROVIDER=selcom
PAYMENT_API_KEY=your_selcom_api_key
PAYMENT_API_SECRET=your_selcom_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

---

## Database Schema Overview

### Key Relationships
- `profiles.userId` → `neon_auth.user.id` (Better Auth users)
- `creator_profiles.profileId` → `profiles.id`
- `content.creatorId` → `profiles.id`
- `payment_intents.userId` → `profiles.id`
- `payment_intents.contentId` → `content.id`
- `entitlements.userId` → `profiles.id`
- `entitlements.contentId` → `content.id`

### Content Pricing
- Stored in `content.price_tzs` (integer, Tanzanian Shillings)
- Preset options: 300, 500, 1000 TZS
- Custom pricing allowed

### Content Types
- `youtube_preview` - YouTube early access
- `upload` - Direct file upload (future)

---

## Next Steps

1. **Test Authentication Flow**
   ```bash
   npm run dev
   # Visit http://localhost:3000/signup
   # Create account → Select role → Set username
   ```

2. **Build Creator Dashboard**
   - Content creation form
   - YouTube URL input
   - Pricing selector (300/500/1000 + custom)
   - Content management

3. **Build Fan Discovery**
   - Query published content from DB
   - Display content cards
   - Category filters

4. **Integrate Real PSP**
   - Choose provider (Selcom/DPO/Flutterwave)
   - Implement provider class
   - Test mobile money flow

---

## API Routes

### Auth
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get session

### Profile
- `POST /api/profile/create` - Create profile after signup

### Payments
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/callback` - Webhook from PSP
- `GET /api/payments/status/[id]` - Check payment status

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle
- **Auth**: Better Auth (Neon Auth)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Payments**: Generic abstraction (PSP-agnostic)
