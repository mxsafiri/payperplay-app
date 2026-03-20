# PayPerPlay Live Streaming Feature Plan

## Executive Summary

This document outlines a comprehensive plan for implementing live streaming functionality on PayPerPlay, enabling creators to go live and earn money in real-time while fans can watch and interact with their favorite creators.

---

## 1. Current Architecture Analysis

### Existing Payment Flow
- **Fan Wallet**: nTZS-powered wallet with M-Pesa deposits
- **Content Purchase**: Synchronous nTZS transfer (fan → creator 85%, platform 15%)
- **Creator Earnings**: Internal ledger tracking with withdrawal to M-Pesa
- **Entitlements**: Access control via database records

### Existing Content Model
- **Content Types**: `youtube_preview`, `upload`
- **Pricing**: Fixed price per content item (TZS)
- **Access**: One-time purchase grants permanent access
- **Media Storage**: S3/R2 for uploads, YouTube URLs for previews

---

## 2. Live Streaming Technical Approach

### Recommended Technology Stack

#### Option A: **WebRTC + Media Server** (Recommended for MVP)
**Pros:**
- Low latency (< 1 second)
- Real-time interaction
- Better for small to medium audiences
- Cost-effective for starting out

**Cons:**
- Scaling requires infrastructure investment
- More complex to implement

**Implementation:**
- **Media Server**: Janus Gateway or LiveKit (open-source)
- **Signaling**: WebSocket for session management
- **Hosting**: Self-hosted on VPS or managed LiveKit Cloud
- **Client**: WebRTC browser APIs (no plugins needed)

#### Option B: **HLS/DASH Streaming**
**Pros:**
- Highly scalable
- CDN-friendly
- Works everywhere (fallback compatible)

**Cons:**
- Higher latency (5-30 seconds)
- Less interactive feel
- More expensive for small audiences

**Implementation:**
- **Ingestion**: RTMP/WHIP endpoint
- **Transcoding**: FFmpeg or cloud service (Mux, Cloudflare Stream)
- **Delivery**: HLS/DASH via CDN
- **Client**: Video.js or HLS.js

#### **Hybrid Approach (Recommended for Production)**
- Start with WebRTC for low-latency live experience
- Simultaneously record to HLS for VOD replay
- Fallback to HLS for viewers with poor connections

### Infrastructure Options

1. **Self-Hosted (Budget-Friendly)**
   - Janus Gateway on DigitalOcean/Hetzner VPS ($20-50/mo)
   - TURN server for NAT traversal
   - S3/R2 for VOD storage

2. **Managed Services (Faster to Market)**
   - **LiveKit Cloud**: $0.009/min per participant (~$0.54/hr per viewer)
   - **Agora**: Similar pricing, more features
   - **Mux**: $0.005/min streaming + $0.001/min viewing
   - **Cloudflare Stream**: $1/1000 minutes delivered

3. **Hybrid (Recommended)**
   - Self-hosted Janus for core streaming
   - Cloudflare R2 for VOD storage ($0.015/GB)
   - Cloudflare CDN for HLS delivery

---

## 3. Monetization Models

### Model 1: **Pay-Per-View Live Access** (Recommended for MVP)
- **How it works**: Fans pay a fixed price to join the live stream
- **Payment timing**: Before entering the stream
- **Access duration**: For the entire live session
- **Pricing**: Creator sets price (e.g., 500-5000 TZS per stream)

**Pros:**
- Simple to implement (reuse existing payment flow)
- Predictable revenue for creators
- Low friction for fans

**Cons:**
- Barrier to entry might reduce audience size
- No earnings from late joiners after stream ends

### Model 2: **Tipping/Donations During Stream**
- **How it works**: Free entry, fans send tips during the stream
- **Payment timing**: Real-time during broadcast
- **Visual feedback**: On-screen notifications, creator shoutouts
- **Pricing**: Flexible amounts (500, 1000, 5000, 10000 TZS)

**Pros:**
- Larger audience (no entry barrier)
- Higher engagement potential
- Viral growth opportunity

**Cons:**
- Unpredictable earnings
- Requires real-time payment processing
- More complex UI/UX

### Model 3: **Hybrid - Free Entry + Premium Features**
- **Base tier**: Free viewing (limited features)
- **Premium tier**: Pay for HD quality, chat access, exclusive emojis
- **Tips**: Available to all viewers

**Pros:**
- Best of both worlds
- Multiple revenue streams
- Flexible for different creator strategies

**Cons:**
- Most complex to implement
- Requires feature gating logic

### **Recommended MVP Approach**
Start with **Model 1 (Pay-Per-View)** for simplicity, then add **Model 2 (Tipping)** in Phase 2.

---

## 4. Database Schema Design

### New Tables

#### `live_streams`
```sql
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_tzs INTEGER NOT NULL, -- Entry price (0 for free streams)
  status TEXT NOT NULL, -- 'scheduled', 'live', 'ended', 'cancelled'
  
  -- Scheduling
  scheduled_start_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  
  -- Stream metadata
  stream_key TEXT UNIQUE, -- Secret key for RTMP/WHIP ingestion
  playback_url TEXT, -- HLS/WebRTC playback URL
  recording_url TEXT, -- VOD URL after stream ends
  
  -- Analytics
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0, -- TZS earned from this stream
  duration_seconds INTEGER, -- Actual stream duration
  
  -- Settings
  enable_chat BOOLEAN DEFAULT true,
  enable_recording BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- false = unlisted (link-only)
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  INDEX idx_creator_id (creator_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_start (scheduled_start_at),
  INDEX idx_category (category)
);
```

#### `live_stream_viewers`
```sql
CREATE TABLE live_stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Access tracking
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  left_at TIMESTAMP,
  watch_duration_seconds INTEGER DEFAULT 0,
  
  -- Payment (if paid stream)
  payment_intent_id UUID REFERENCES payment_intents(id),
  
  UNIQUE(stream_id, viewer_id),
  INDEX idx_stream_id (stream_id),
  INDEX idx_viewer_id (viewer_id)
);
```

#### `live_stream_tips`
```sql
CREATE TABLE live_stream_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount_tzs INTEGER NOT NULL,
  message TEXT, -- Optional message with tip
  
  -- Payment tracking
  payment_intent_id UUID REFERENCES payment_intents(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  INDEX idx_stream_id (stream_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at)
);
```

#### `live_stream_chat`
```sql
CREATE TABLE live_stream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  INDEX idx_stream_id_created (stream_id, created_at),
  INDEX idx_user_id (user_id)
);
```

### Schema Updates to Existing Tables

#### Update `content_type` enum
```sql
ALTER TYPE content_type ADD VALUE 'live_stream';
ALTER TYPE content_type ADD VALUE 'live_vod'; -- Recorded live stream
```

#### Update `wallet_tx_type` enum
```sql
ALTER TYPE wallet_tx_type ADD VALUE 'live_earning';
ALTER TYPE wallet_tx_type ADD VALUE 'tip_earning';
```

---

## 5. Creator Live Streaming Interface (UI/UX)

### 5.1 Creator Dashboard - Live Tab

**Location**: `/creator/live`

**Features**:
- **Go Live Button**: Prominent CTA to start streaming
- **Scheduled Streams**: Calendar view of upcoming streams
- **Past Streams**: History with analytics (viewers, earnings, duration)
- **Stream Settings**: Configure default settings

### 5.2 Pre-Stream Setup Flow

**Step 1: Stream Details**
- Title (required)
- Description
- Category dropdown
- Thumbnail upload
- Price (TZS) - with suggested amounts (500, 1000, 2000, 5000)
- Schedule (now vs. scheduled)

**Step 2: Stream Settings**
- Enable chat (toggle)
- Enable recording for VOD (toggle)
- Public vs. Unlisted

**Step 3: Technical Setup**
- **Option A**: Browser streaming (WebRTC - one click)
- **Option B**: External software (OBS) - show stream key
- Camera/mic permissions check
- Preview window

### 5.3 Live Streaming Interface

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  [LIVE] Stream Title                    [End Stream]│
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              CAMERA PREVIEW                         │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  👁 125 viewers    💰 12,500 TZS    ⏱ 15:32        │
├─────────────────────────────────────────────────────┤
│  CHAT                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ @mbong0: Amazing content! 🔥                  │ │
│  │ @mxfalcon sent 1000 TZS 💸                    │ │
│  │ @user123: When is the next stream?           │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Real-time Stats Panel**:
- Current viewers count
- Total earnings (live updates)
- Stream duration
- Peak viewers

**Chat Panel**:
- Live chat messages
- Tip notifications (highlighted)
- Pin important messages
- Moderation controls (delete, timeout)

### 5.4 Post-Stream Summary

**Shown immediately after ending stream**:
- Total viewers
- Peak viewers
- Total earnings
- Stream duration
- Recording status (processing → ready)
- Option to publish as VOD content

---

## 6. Fan Live Viewing Experience (UI/UX)

### 6.1 Live Streams Discovery

**Location**: `/live` or `/dashboard` (dedicated section)

**Features**:
- **Live Now**: Grid of currently live streams
- **Upcoming**: Scheduled streams with countdown
- **Categories**: Filter by category
- **Following**: Streams from followed creators

**Stream Card**:
```
┌─────────────────────────────┐
│  [🔴 LIVE]  👁 234          │
│                             │
│    THUMBNAIL/PREVIEW        │
│                             │
│  Creator Name               │
│  Stream Title               │
│  💰 1,500 TZS              │
└─────────────────────────────┘
```

### 6.2 Stream Entry Flow (Paid Streams)

**Step 1: Stream Preview**
- Thumbnail
- Title & description
- Creator info
- Price
- Current viewer count
- "Join Stream" button

**Step 2: Payment**
- Show price
- Check wallet balance
- One-click purchase (if sufficient balance)
- Redirect to wallet top-up (if insufficient)

**Step 3: Enter Stream**
- Immediate access after payment
- Loading state while connecting

### 6.3 Live Viewing Interface

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  [🔴 LIVE] Stream Title          👁 125  ⏱ 15:32   │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              VIDEO PLAYER                           │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Creator Name  [Follow] [Tip]                       │
├─────────────────────────────────────────────────────┤
│  CHAT                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ @mbong0: Amazing content! 🔥                  │ │
│  │ You sent 1000 TZS 💸                          │ │
│  │ @user123: When is the next stream?           │ │
│  │ [Type a message...]                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Full-screen mode
- Quality selector (if HLS)
- Volume control
- Live indicator with viewer count
- Chat (if enabled)
- Tip button (quick amounts: 500, 1000, 5000 TZS)
- Share button
- Report button

### 6.4 Tipping Flow

**Quick Tip**:
1. Click "Tip" button
2. Select amount (500, 1000, 5000, 10000 TZS) or custom
3. Optional message
4. Confirm (one-click if balance sufficient)
5. Toast notification: "Tip sent! 💸"
6. On-screen animation in stream

**Tip Display**:
- Chat message: "@username sent 1000 TZS 💸 [message]"
- Visual effect on stream (confetti, badge, etc.)
- Creator sees notification in real-time

---

## 7. Implementation Roadmap

### Phase 1: MVP (4-6 weeks)

#### Week 1-2: Backend Infrastructure
- [ ] Set up media server (Janus Gateway or LiveKit)
- [ ] Database schema migration (live_streams, live_stream_viewers)
- [ ] API endpoints:
  - `POST /api/creator/live/create` - Create stream
  - `POST /api/creator/live/start` - Start streaming
  - `POST /api/creator/live/end` - End stream
  - `GET /api/live` - List live streams
  - `GET /api/live/[id]` - Get stream details
  - `POST /api/live/[id]/join` - Join stream (with payment)
  - `GET /api/live/[id]/playback` - Get playback URL

#### Week 3-4: Creator Interface
- [ ] `/creator/live` dashboard page
- [ ] Stream creation flow
- [ ] Browser-based streaming (WebRTC)
- [ ] Live streaming interface with stats
- [ ] End stream flow with summary

#### Week 5-6: Fan Interface
- [ ] `/live` discovery page
- [ ] Stream detail/preview page
- [ ] Payment integration for stream access
- [ ] Live viewing interface
- [ ] Basic chat (WebSocket)

### Phase 2: Enhanced Features (3-4 weeks)

#### Week 7-8: Tipping System
- [ ] Database schema for tips
- [ ] Tip API endpoints
- [ ] Tip UI in viewer interface
- [ ] Real-time tip notifications
- [ ] Tip leaderboard

#### Week 9-10: VOD & Analytics
- [ ] Automatic recording to S3/R2
- [ ] VOD playback after stream ends
- [ ] Creator analytics dashboard
- [ ] Viewer watch history

### Phase 3: Advanced Features (4-6 weeks)

#### Week 11-12: Scheduling & Notifications
- [ ] Schedule streams in advance
- [ ] Email/push notifications for followers
- [ ] Countdown timers
- [ ] Reminder system

#### Week 13-14: Chat Enhancements
- [ ] Emojis and reactions
- [ ] Chat moderation tools
- [ ] Pinned messages
- [ ] Slow mode

#### Week 15-16: Mobile Optimization
- [ ] Mobile-responsive streaming interface
- [ ] Mobile camera streaming
- [ ] Mobile viewing optimizations
- [ ] Picture-in-picture mode

---

## 8. Technical Considerations

### 8.1 Scalability
- **Concurrent streams**: Start with 10-20, scale to 100+
- **Viewers per stream**: 50-500 initially
- **CDN**: Cloudflare for HLS delivery
- **Database**: Connection pooling, read replicas for analytics

### 8.2 Security
- **Stream keys**: Secure generation, rotation on demand
- **Access control**: JWT-based authentication for playback
- **Rate limiting**: Prevent spam in chat and tipping
- **Content moderation**: Report system, auto-ban for violations

### 8.3 Performance
- **Latency target**: < 2 seconds for WebRTC, < 10s for HLS
- **Adaptive bitrate**: Multiple quality levels for HLS
- **CDN caching**: Edge caching for HLS segments
- **Database indexing**: Optimize queries for live viewer counts

### 8.4 Monitoring
- **Stream health**: Monitor bitrate, dropped frames, latency
- **Server metrics**: CPU, memory, bandwidth usage
- **Error tracking**: Sentry for client/server errors
- **Analytics**: Track viewer engagement, earnings, retention

---

## 9. Cost Estimation

### Infrastructure (Monthly)

**Self-Hosted Approach**:
- VPS (8GB RAM, 4 vCPU): $40/mo
- TURN server: $10/mo
- S3/R2 storage (100GB): $2/mo
- Bandwidth (1TB): $10/mo
- **Total**: ~$60-80/mo

**Managed Service Approach (LiveKit)**:
- 1000 viewer-hours/mo: $540/mo
- Storage (100GB): $2/mo
- **Total**: ~$550/mo

**Hybrid Approach (Recommended)**:
- Self-hosted Janus: $40/mo
- Cloudflare R2 (100GB): $1.50/mo
- Cloudflare CDN (1TB): Free tier
- **Total**: ~$50/mo

### Development Costs
- Phase 1 (MVP): 4-6 weeks
- Phase 2 (Enhanced): 3-4 weeks
- Phase 3 (Advanced): 4-6 weeks
- **Total**: 11-16 weeks

---

## 10. Success Metrics

### Creator Metrics
- Number of creators going live weekly
- Average stream duration
- Average earnings per stream
- Repeat streaming rate

### Fan Metrics
- Live stream discovery rate
- Conversion rate (preview → paid entry)
- Average watch time
- Tip conversion rate

### Platform Metrics
- Total live hours streamed
- Total viewers served
- Platform revenue (15% of earnings)
- VOD replay views

---

## 11. Risks & Mitigation

### Technical Risks
- **Risk**: Stream quality issues (buffering, lag)
  - **Mitigation**: Adaptive bitrate, fallback to HLS, CDN
  
- **Risk**: Server overload during peak times
  - **Mitigation**: Auto-scaling, load balancing, rate limiting

### Business Risks
- **Risk**: Low creator adoption
  - **Mitigation**: Onboarding tutorials, test streams, incentives
  
- **Risk**: Payment fraud
  - **Mitigation**: nTZS wallet verification, rate limits, monitoring

### Legal Risks
- **Risk**: Copyright violations (music, content)
  - **Mitigation**: DMCA policy, content moderation, creator guidelines
  
- **Risk**: Inappropriate content
  - **Mitigation**: Community guidelines, report system, auto-moderation

---

## 12. Next Steps

1. **Validate Approach**: Review this plan with stakeholders
2. **Choose Infrastructure**: Decide on self-hosted vs. managed
3. **Set Up Dev Environment**: Install Janus/LiveKit locally
4. **Create Database Migration**: Implement schema changes
5. **Build MVP Backend**: API endpoints for stream lifecycle
6. **Build MVP Frontend**: Creator and fan interfaces
7. **Internal Testing**: Test with 2-3 creators
8. **Beta Launch**: Invite 10-20 creators for beta
9. **Public Launch**: Full rollout with marketing

---

## Appendix A: Alternative Technologies Considered

### Media Servers
- **Janus Gateway**: ✅ Chosen for self-hosted (lightweight, WebRTC-first)
- **LiveKit**: ✅ Chosen for managed option (great DX, scalable)
- **Kurento**: ❌ Too complex, overkill for MVP
- **Ant Media Server**: ❌ Paid license required
- **Wowza**: ❌ Expensive

### Streaming Protocols
- **WebRTC**: ✅ Low latency, real-time
- **HLS**: ✅ Scalable, CDN-friendly (fallback)
- **RTMP**: ✅ For ingestion from OBS
- **SRT**: ❌ Not widely supported in browsers
- **DASH**: ❌ Similar to HLS, less adoption

### Cloud Services
- **Mux**: Great API, but expensive for small scale
- **Agora**: Feature-rich, but complex pricing
- **Cloudflare Stream**: Good for VOD, limited live features
- **AWS IVS**: Expensive, AWS lock-in
