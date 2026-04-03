import "dotenv/config";
import express from "express";
import cors from "cors";
import visionRoutes from "./routes/visionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import "./queues/imageQueue.js"; // start the image-generation worker
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Livya API",
    endpoints: {
      text: "POST /vision",
      image: "POST /vision/image"
    }
  });
});

app.use("/", visionRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Livya API running on http://localhost:${PORT}`);
});
