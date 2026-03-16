#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'https://payperplay.xyz';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getVideosNeedingThumbnails() {
  const response = await fetch(`${BASE_URL}/api/admin/backfill-thumbnails`);
  return response.json();
}

async function extractThumbnail(contentId) {
  const response = await fetch(`${BASE_URL}/api/admin/extract-thumbnail/${contentId}`, {
    method: 'POST',
  });
  return response.json();
}

async function main() {
  console.log('🔍 Checking for videos without thumbnails...\n');
  
  const data = await getVideosNeedingThumbnails();
  
  console.log(`Found ${data.total} videos needing thumbnails:`);
  console.log(`- YouTube: ${data.youtube.length}`);
  console.log(`- Uploads: ${data.uploads.length}\n`);

  // Backfill YouTube thumbnails (fast)
  if (data.youtube.length > 0) {
    console.log('📺 Backfilling YouTube thumbnails...');
    const ytResponse = await fetch(`${BASE_URL}/api/admin/backfill-thumbnails`, {
      method: 'POST',
    });
    const ytResult = await ytResponse.json();
    console.log(`✓ ${ytResult.message}\n`);
  }

  // Process uploaded videos one by one
  if (data.uploads.length > 0) {
    console.log('🎬 Extracting thumbnails from uploaded videos...\n');
    
    for (let i = 0; i < data.uploads.length; i++) {
      const video = data.uploads[i];
      console.log(`[${i + 1}/${data.uploads.length}] Processing: ${video.title}`);
      
      try {
        const result = await extractThumbnail(video.id);
        if (result.success) {
          console.log(`  ✓ Thumbnail extracted: ${result.thumbnailKey}`);
        } else if (result.skipped) {
          console.log(`  ⊘ Skipped (already has thumbnail)`);
        } else {
          console.log(`  ✗ Failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
      
      // Wait 2 seconds between requests to avoid overwhelming the server
      if (i < data.uploads.length - 1) {
        await sleep(2000);
      }
    }
    
    console.log('\n✅ Thumbnail extraction complete!');
  } else {
    console.log('✅ All videos already have thumbnails!');
  }
}

main().catch(console.error);
