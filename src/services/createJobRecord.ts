import { prisma } from "../db/client"

export interface SharedJobInput {
  prompt: string
  userId: string
  isRemix?: boolean
  model?: string
  style_type?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  negative_prompt?: string
  seed?: number
  color_palette?: any
  image_description?: string
  image_input_url?: string
  image_weight?: number
  style_builder?: string
  is_published?: boolean
}

/**
 * Creates an image generation record in the database.
 * Note: Using GeneratedImage model instead of Job since Job model doesn't exist in the schema.
 * @param {SharedJobInput} input - The job data to save.
 * @returns {Promise<string>} - The ID of the created image record.
 */
export const createJobRecord = async (input: SharedJobInput): Promise<string> => {
  const {
    prompt,
    userId,
    model,
    style_type,
    aspect_ratio,
    image_description,
    magic_prompt_option,
    negative_prompt,
    seed = Math.floor(Math.random() * 2147483647), // Default seed if not provided
    color_palette,
    is_published = false,
    image_input_url,
    image_weight,
    style_builder,
    isRemix = false,
  } = input

  // Adapt the data structure to fit the GeneratedImage model
  const imageRecord = await prisma.generatedImage.create({
    data: {
      userId,
      prompt,
      seed, 
      negative_prompt: negative_prompt || null,
      img_result: "", // This will be populated later when the image is generated
      aspect_ratio: aspectRatioToEnum(aspect_ratio) || "ASPECT_1_1", // Default to square if not provided
      is_published: false,
      model: model ? mapModelToEnum(model) : null,
      style_type: style_type ? mapStyleTypeToEnum(style_type) : null,
      color_palette: color_palette || null,
      prompt_enhanced: magic_prompt_option || null,
      image_input_url,
      image_weight,
      style_builder,
      image_description,
    },
  })

  return imageRecord.id
}

const aspectRatioToEnum = (value?: string): any => {
  if (!value) return "ASPECT_1_1" // Default to square aspect ratio
  
  // Convert string values to the IAspect enum format
  const formatMap: Record<string, string> = {
    "1:1": "ASPECT_1_1",
    "16:9": "ASPECT_16_9",
    "9:16": "ASPECT_9_16",
    "4:3": "ASPECT_4_3",
    "3:4": "ASPECT_3_4",
    "3:2": "ASPECT_3_2",
    "2:3": "ASPECT_2_3",
    "16:10": "ASPECT_16_10",
    "10:16": "ASPECT_10_16",
  }
  
  return formatMap[value] || value
}

const mapModelToEnum = (value: string): any => {
  // Convert model string to IModel enum
  const modelMap: Record<string, string> = {
    "v1": "V_1",
    "v2": "V_2",
    "v2a": "V_2A"
  }
  
  return modelMap[value.toLowerCase()] || null
}

const mapStyleTypeToEnum = (value: string): any => {
  // Convert style type string to IStyleType enum
  const styleMap: Record<string, string> = {
    "auto": "AUTO",
    "general": "GENERAL",
    "realistic": "REALISTIC",
    "design": "DESIGN",
    "render_3d": "RENDER_3D",
    "3d": "RENDER_3D",
    "anime": "ANIME"
  }
  
  return styleMap[value.toLowerCase()] || null
}

/**
 * Fetches a generated image by ID from the database.
 * Using GeneratedImage model since Job model doesn't exist in the schema.
 * @param {string} jobId - The ID of the job/image.
 * @returns {Promise<GeneratedImage|null>}
 */
export const getJobById = async (jobId: string) => {
  return await prisma.generatedImage.findUnique({ where: { id: jobId } })
}
