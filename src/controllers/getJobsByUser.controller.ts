import { Request, Response } from "express"
import { prisma } from "../db/client"

/**
 * Retrieves all image generation jobs for a given user.
 * Using GeneratedImage model since Job model doesn't exist in the database schema.
 */
export const getJobsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: "userId is required" })
    }

    const images = await prisma.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return res.status(200).json({ jobs: images })
  } catch (err) {
    console.error("❌ Error fetching jobs:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
}

/**
 * Deletes an image job if it belongs to the requesting user.
 * Using GeneratedImage model since Job model doesn't exist in the database schema.
 */
export const deleteJobById = async (req: Request, res: Response) => {
  const { jobId } = req.params
  const { userId } = req.body

  if (!jobId || !userId) {
    return res.status(400).json({ error: "Missing jobId or userId" })
  }

  try {
    const image = await prisma.generatedImage.findUnique({ where: { id: jobId } })

    if (!image) {
      return res.status(404).json({ error: "Job not found" })
    }

    if (image.userId !== userId) {
      return res.status(403).json({ error: "You do not have permission to delete this job." })
    }

    await prisma.generatedImage.delete({ where: { id: jobId } })

    return res.status(200).json({ message: "Job deleted successfully." })
  } catch (error) {
    console.error("❌ Error deleting job:", error)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
