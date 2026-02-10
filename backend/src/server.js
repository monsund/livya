import "dotenv/config";
import express from "express";
import cors from "cors";
import visionRoutes from "./routes/visionRoutes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/", visionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Livya API running on http://localhost:${PORT}`);
});
