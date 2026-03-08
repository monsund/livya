import "dotenv/config";
import express from "express";
import cors from "cors";
import visionRoutes from "./routes/visionRoutes.js";
import "./queues/imageQueue.js"; // start the image-generation worker
import dotenv from "dotenv";

dotenv.config();
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

app.listen(PORT, () => {
  console.log(`🚀 Livya API running on http://localhost:${PORT}`);
  console.log(`📚 OpenAI key: ${process.env.OPENAI_API_KEY}`);
});
