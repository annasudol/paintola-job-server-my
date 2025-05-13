import { Router } from "express"
import generateImageRoute from "./generateImage.route"
// import jobStatusRoute from "./jobStatus.route"
import jobsRoute from "./jobs.route"
import remixRoutes from "./remix.route"

const router = Router()

router.use("/generate-image", generateImageRoute)
router.use("/remix-image", remixRoutes)
router.use("/jobs", jobsRoute)

export default router
