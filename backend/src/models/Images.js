import mongoose from "mongoose";

const imageItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    prompt: String, // visualPrompt used for generation
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "completed",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    sceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scene",
      required: true,
      index: true,
    },
    images: [imageItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Image", imageSchema);
