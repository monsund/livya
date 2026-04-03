import mongoose from "mongoose";

const finalVideoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sceneVideoIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SceneVideo",
        required: true,
      }
    ],
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    isLatest: {
      type: Boolean,
      default: true,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    totalDuration: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "stitching", "completed", "failed", "cancelled"],
      default: "queued",
      required: true,
    },
    error: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FinalVideo", finalVideoSchema);
