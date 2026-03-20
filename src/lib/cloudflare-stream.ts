/**
 * Cloudflare Stream Live API client
 *
 * Handles creating live inputs, managing streams, and retrieving playback URLs.
 * Docs: https://developers.cloudflare.com/stream/stream-live/
 */

const CF_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!; // Same Cloudflare account as R2
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN || "";
const CF_CUSTOMER_SUBDOMAIN = process.env.CF_STREAM_CUSTOMER_SUBDOMAIN || `customer-${CF_ACCOUNT_ID}`;

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`;

async function cfFetch(path: string, options: RequestInit = {}) {
  if (!CF_STREAM_API_TOKEN) {
    throw new Error("CF_STREAM_API_TOKEN is not configured. Add it to your .env file.");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CF_STREAM_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!data.success) {
    const errMsg = data.errors?.map((e: { message: string }) => e.message).join(", ") || "Unknown Cloudflare Stream error";
    throw new Error(`Cloudflare Stream API error: ${errMsg}`);
  }

  return data.result;
}

/**
 * Create a new live input (stream key + RTMP/SRT/WebRTC endpoints).
 * This is called when a creator sets up a new livestream.
 */
export async function createLiveInput(params: {
  creatorId: string;
  title: string;
  recording?: boolean;
}) {
  const result = await cfFetch("/live_inputs", {
    method: "POST",
    body: JSON.stringify({
      meta: {
        name: params.title,
        creatorId: params.creatorId,
      },
      recording: {
        mode: params.recording !== false ? "automatic" : "off",
        timeoutSeconds: 300, // End recording 5 min after disconnect
      },
      defaultCreator: params.creatorId,
    }),
  });

  return {
    inputId: result.uid as string,
    rtmpUrl: result.rtmps?.url as string,       // rtmps://live.cloudflare.com:443/live/
    rtmpKey: result.rtmps?.streamKey as string,  // Stream key for OBS
    srtUrl: result.srt?.url as string,           // srt://live.cloudflare.com:778
    srtPassphrase: result.srt?.passphrase as string,
    // WebRTC (WHIP) — for browser-based streaming
    webRtcPublishUrl: result.webRTC?.url as string,
    // Playback URLs — using customer subdomain
    playbackHls: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${result.uid}/manifest/video.m3u8`,
    playbackWebRtc: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${result.uid}/webRTC/play`,
    playbackIframe: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${result.uid}/iframe`,
  };
}

/**
 * Get the current status of a live input (whether it's connected/streaming).
 */
export async function getLiveInputStatus(inputId: string) {
  try {
    const result = await cfFetch(`/live_inputs/${inputId}`);
    return {
      connected: result.status?.current?.state === "connected",
      state: result.status?.current?.state as string | undefined,
    };
  } catch {
    return { connected: false, state: "unknown" };
  }
}

/**
 * List videos produced by a live input (recordings).
 */
export async function getLiveInputVideos(inputId: string) {
  try {
    const result = await cfFetch(`/live_inputs/${inputId}/videos`);
    return (result || []).map((video: Record<string, unknown>) => ({
      videoId: video.uid as string,
      status: (video.status as Record<string, unknown>)?.state as string,
      duration: video.duration as number,
      size: video.size as number,
      playbackUrl: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${video.uid}/manifest/video.m3u8`,
      thumbnailUrl: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${video.uid}/thumbnails/thumbnail.jpg`,
      created: video.created as string,
    }));
  } catch {
    return [];
  }
}

/**
 * Delete a live input when stream is done and recording is saved.
 */
export async function deleteLiveInput(inputId: string) {
  try {
    await cfFetch(`/live_inputs/${inputId}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get playback URLs for a live stream.
 * Works for both live streams and recorded videos.
 */
export function getPlaybackUrls(inputIdOrVideoId: string) {
  return {
    hls: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${inputIdOrVideoId}/manifest/video.m3u8`,
    webrtc: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${inputIdOrVideoId}/webRTC/play`,
    iframe: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${inputIdOrVideoId}/iframe`,
    thumbnail: `https://${CF_CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${inputIdOrVideoId}/thumbnails/thumbnail.jpg`,
  };
}

/**
 * Check if Cloudflare Stream is configured.
 */
export function isStreamConfigured(): boolean {
  return !!CF_STREAM_API_TOKEN;
}
