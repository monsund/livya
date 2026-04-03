import mongoose from "mongoose";

const voiceoverSchema = new mongoose.Schema(
  {
    script: {
      type: String,
      required: true, // ⭐ voiceover text is mandatory
    },

    audioUrl: String,

    language: String,
    voice: String,

    duration: Number,

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    isDefault: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const sceneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    index: {
      type: Number, // ⭐ scene order within project
      required: true,
    },

    title: String,

    // 🎬 AI-generated structured fields
    visual: String,
    environment: [String],
    actions: String,
    mood: String,
    camera: String,

    // 🎯 final prompt used for image generation
    visualPrompt: String,

    // 🖼️ generated image
    imageUrl: String,

    // 🎙️ voiceovers (supports multiple versions)
    voiceovers: [voiceoverSchema],

    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ✅ ensure unique scene order per project
sceneSchema.index({ projectId: 1, index: 1 }, { unique: true });

export default mongoose.model("Scene", sceneSchema);