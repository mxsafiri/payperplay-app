import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { getPresignedReadUrl, uploadToR2 } from './storage/r2';

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  
  // Load FFmpeg WASM
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Extract a thumbnail from a video stored in R2
 * Downloads video, extracts frame using FFmpeg WASM, uploads to R2
 */
export async function extractThumbnailFromR2Video(videoStorageKey: string): Promise<string> {
  try {
    console.log(`[Thumbnail] Starting extraction for: ${videoStorageKey}`);
    
    // Get presigned URL to download the video
    const videoUrl = await getPresignedReadUrl({
      key: videoStorageKey,
      expiresInSeconds: 3600,
    });

    // Download video file
    console.log('[Thumbnail] Downloading video...');
    const videoData = await fetchFile(videoUrl);
    
    // Initialize FFmpeg
    const ffmpeg = await getFFmpeg();
    
    // Write video to FFmpeg virtual filesystem
    await ffmpeg.writeFile('input.mp4', videoData);
    
    // Extract frame at 1 second
    console.log('[Thumbnail] Extracting frame...');
    await ffmpeg.exec([
      '-ss', '1',           // Seek to 1 second
      '-i', 'input.mp4',    // Input file
      '-vframes', '1',      // Extract 1 frame
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease', // Scale to 720p
      '-q:v', '2',          // High quality JPEG
      'thumbnail.jpg'       // Output file
    ]);
    
    // Read the generated thumbnail
    const thumbnailData = await ffmpeg.readFile('thumbnail.jpg');
    
    // Clean up FFmpeg filesystem
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('thumbnail.jpg');
    
    // Upload thumbnail to R2
    const thumbKey = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    console.log(`[Thumbnail] Uploading to R2: ${thumbKey}`);
    
    await uploadToR2({
      key: thumbKey,
      body: thumbnailData as Buffer,
      contentType: 'image/jpeg',
    });
    
    console.log(`[Thumbnail] Success: ${thumbKey}`);
    return thumbKey;
    
  } catch (error) {
    console.error('[Thumbnail] Extraction failed:', error);
    throw new Error(`Failed to extract thumbnail: ${error instanceof Error ? error.message : String(error)}`);
  }
}
