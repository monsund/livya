import mongoose from "mongoose";

const sceneVideoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scene",
      required: true,
    },
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
      default: '',
    },
    duration: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
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

export default mongoose.model("SceneVideo", sceneVideoSchema);
