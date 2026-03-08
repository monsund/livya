import { Queue, Worker, QueueEvents } from 'bullmq';
import { generateImagesForScenes } from '../generateImagesFromScenes.js';

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

const connection = {
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null
};

console.log(`[ImageQueue] Connecting to Redis at ${connection.url}`);

export const imageQueue = new Queue('image-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const imageQueueEvents = new QueueEvents('image-generation', { connection });

export const imageWorker = new Worker(
  'image-generation',
  async (job) => {
    const { scene } = job.data;
    const t0 = Date.now();
    console.log(`[ImageQueue] 🔄 Job ${job.id} — generating image for scene ${scene.scene_id} ("${scene.title || scene.visual?.slice(0, 40)}")`);
    const results = await generateImagesForScenes([scene]);
    const r = results[0];
    if (!r || r.error) {
      throw new Error(r?.error || `Image generation failed for scene ${scene.scene_id}`);
    }
    console.log(`[ImageQueue] ✅ Job ${job.id} — scene ${r.scene_id} done in ${Date.now() - t0}ms`);
    return { scene_id: r.scene_id, image_path: r.image_path };
  },
  { connection, concurrency: 3 }
);

imageWorker.on('ready', () => {
  console.log('[ImageQueue] Worker ready — concurrency 3, waiting for jobs');
});

imageWorker.on('completed', (job, result) => {
  console.log(`[ImageQueue] ✅ Scene ${result.scene_id} image ready: ${result.image_path}`);
});

imageWorker.on('failed', (job, err) => {
  console.error(`[ImageQueue] ❌ Job ${job?.id} (scene ${job?.data?.scene?.scene_id}) failed: ${err.message}`);
});

imageWorker.on('stalled', (jobId) => {
  console.warn(`[ImageQueue] ⚠️ Job ${jobId} stalled — will be retried`);
});

imageWorker.on('error', (err) => {
  console.error('[ImageQueue] Worker error:', err.message);
});
