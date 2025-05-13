import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { uploadImageFromUrl } from "../services/uploadToCloudinary"
import { generateRemixFromPrompt } from "../services/ideogramRemix.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"

// Helper functions to map values to enum types
function mapModelToEnum(value: string): any {
  const modelMap: Record<string, string> = {
    "v1": "V_1",
    "v2": "V_2",
    "v2a": "V_2A"
  }
  return modelMap[value?.toLowerCase()] || null
}

function mapStyleTypeToEnum(value: string): any {
  const styleMap: Record<string, string> = {
    "auto": "AUTO",
    "general": "GENERAL",
    "realistic": "REALISTIC",
    "design": "DESIGN",
    "render_3d": "RENDER_3D",
    "3d": "RENDER_3D",
    "anime": "ANIME"
  }
  return styleMap[value?.toLowerCase()] || null
}
import { imageQueue } from "../queue/imageQueue"

let imageWorker: Worker | null = null

/**
 * Starts the BullMQ worker to process image generation jobs.
 * Automatically avoids multiple workers starting at once.
 */
export async function startImageWorker() {
  if (imageWorker) {
    console.log("⚙️ [WorkerManager] Worker already running. Skip starting again.")
    return
  }

  console.log("🛠️ [WorkerManager] Starting new Worker...")

  imageWorker = new Worker(
    "image-generation",
    async (job: Job) => {
      const {
        jobId,
        prompt,
        userId,
        model,
        isRemix,
        style_type,
        aspect_ratio,
        magic_prompt_option,
        negative_prompt,
        seed,
        color_palette,
        image_weight,
        image_input_url,
      } = job.data

      try {
        console.log("👷 [Worker] Processing Job:", jobId)

        // Since Job model doesn't exist, we'll create or update the GeneratedImage record instead
        const existingImage = await prisma.generatedImage.findUnique({ where: { id: jobId } })
        
        if (existingImage) {
          // Update existing image record
          await prisma.generatedImage.update({
            where: { id: jobId },
            data: { 
              is_published: false,
              updatedAt: new Date()
            },
          })
        } else {
          // Create a placeholder image record if it doesn't exist yet
          await prisma.generatedImage.create({
            data: {
              id: jobId,
              userId,
              prompt,
              img_result: "", // Temporary empty result until image is generated
              seed: seed || Math.floor(Math.random() * 2147483647),
              aspect_ratio: aspect_ratio || "ASPECT_1_1",
              negative_prompt: negative_prompt || null,
              createdAt: new Date(),
              updatedAt: new Date(),
              is_published: false
            },
          })
        }

        // Generate image (remix or new)
        const data = isRemix
          ? await generateRemixFromPrompt({
              prompt,
              model,
              style_type,
              aspect_ratio,
              magic_prompt_option,
              image_input_url,
              seed,
              color_palette,
              image_weight,
            })
          : await generateImageFromPrompt({
              prompt,
              model,
              style_type,
              aspect_ratio,
              seed,
              magic_prompt_option,
              color_palette,
              negative_prompt,
            })

        // Upload to Cloudinary
        const cdnUrl = await uploadImageFromUrl(data.url, userId)

        // Since Job model doesn't exist, we directly update the GeneratedImage record
        await prisma.generatedImage.update({
          where: { id: jobId },
          data: {
            img_result: cdnUrl,
            prompt,
            model: model ? mapModelToEnum(model) : null,
            style_type: style_type ? mapStyleTypeToEnum(style_type) : null,
            aspect_ratio: aspect_ratio || "ASPECT_1_1",
            color_palette: color_palette ? JSON.parse(JSON.stringify(color_palette)) : null,
            negative_prompt: negative_prompt || null,
            image_weight: image_weight || null,
            image_input_url: image_input_url || null,
            seed: data.seed,
            prompt_enhanced: magic_prompt_option?.toLowerCase() === "on" ? data.prompt : null,
            is_published: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        console.log(`✅ [Worker] Job ${jobId} completed.`)
        return { imageUrl: cdnUrl }
      } catch (error: any) {
        const friendlyMessage = getApiErrorMessage(error)

        // Since Job model doesn't exist, we update the GeneratedImage record to indicate failure
        try {
          const existingImage = await prisma.generatedImage.findUnique({ where: { id: jobId } })
          
          if (existingImage) {
            await prisma.generatedImage.update({
              where: { id: jobId },
              data: { 
                is_published: false,
                img_result: "", // Empty since generation failed
                updatedAt: new Date()
              },
            })
          }
        } catch (updateError) {
          console.error("Failed to update image record for failed job:", updateError)
        }

        console.error(`❌ [Worker] Job ${jobId} failed:`, friendlyMessage)
        return { error: friendlyMessage }
      }
    },
    {
      connection: redisConnection,
      removeOnComplete: { age: 60, count: 2 },
      removeOnFail: { age: 120, count: 2 },
      stalledInterval: 86400000, // 24 hours
    }
  )

  // Graceful shutdown on SIGTERM
  process.on("SIGTERM", async () => {
    if (imageWorker) {
      console.log("🔻 [WorkerManager] Shutting down Worker due to SIGTERM...")
      await imageWorker.close()
      imageWorker = null
    }
  })

  imageWorker.on("completed", async (job) => {
    console.log(`🛑 [WorkerManager] Worker completed job: ${job.id}`)
    await handleWorkerShutdown()
  })

  imageWorker.on("failed", async (job) => {
    console.log(`🛑 [WorkerManager] Worker failed job: ${job?.id}`)
    await handleWorkerShutdown()
  })
}

/**
 * Checks if the queue is empty.
 * Stops the worker if no jobs are left.
 */
async function handleWorkerShutdown() {
  const counts = await imageQueue.getJobCounts()
  console.log("📊 [WorkerManager] Queue status after job:", counts)

  if (counts.waiting === 0 && counts.active === 0) {
    console.log("🛑 [WorkerManager] No jobs left. Stopping Worker...")
    await stopImageWorker()
  } else {
    console.log("⏳ [WorkerManager] Jobs still pending. Worker continues running...")
  }
}

/**
 * Stops the current worker instance.
 */
export async function stopImageWorker() {
  if (imageWorker) {
    console.log("🛑 [WorkerManager] Stopping Worker cleanly...")
    await imageWorker.close()
    imageWorker = null
  }
}
