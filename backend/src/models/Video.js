import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    url: String,
    status: {
      type: String,
      enum: ["processing", "done"],
      default: "processing",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);