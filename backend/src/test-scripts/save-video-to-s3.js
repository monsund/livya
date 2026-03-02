/**
 * One-off script: download a Runway video URL and upload it to S3.
 * Usage: node src/test-scripts/save-video-to-s3.js <sceneId> <runwayVideoUrl>
 *
 * Example:
 *   node src/test-scripts/save-video-to-s3.js 5 "https://dnznrvs05pmza.cloudfront.net/..."
 */
import 'dotenv/config';
import { uploadVideoToS3 } from '../services/runwayService.js';

const [,, sceneId, videoUrl] = process.argv;

if (!sceneId || !videoUrl) {
  console.error('Usage: node src/test-scripts/save-video-to-s3.js <sceneId> <runwayVideoUrl>');
  process.exit(1);
}

console.log(`Downloading and uploading video for scene ${sceneId}...`);
try {
  const s3Url = await uploadVideoToS3(videoUrl, sceneId);
  console.log('\n✅ Uploaded successfully!');
  console.log('S3 URL:', s3Url);
  console.log('\nPaste this into mockData.js videos array:');
  console.log(JSON.stringify({ scene_id: Number(sceneId), videoUrl: s3Url }, null, 2));
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}
