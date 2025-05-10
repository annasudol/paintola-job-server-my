import express from "express"
import http from "http"
import dotenv from "dotenv"
import cors from "cors"
import apiRoutes from "./api"
import { initSocketServer } from "./ws/socket"
import { initQueueEventListeners } from "./queue/imageQueue"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use("/api", apiRoutes)

// Create HTTP server for socket.io
const server = http.createServer(app)
// Init WebSocket server
initSocketServer(server)
initQueueEventListeners()

// Digital Ocean expects apps to run on port 8080 by default
// Use PORT from env if provided, otherwise default to 8080 for Digital Ocean compatibility
const PORT = Number(process.env.PORT) || 8080
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Node.js version: ${process.version}`)
})
