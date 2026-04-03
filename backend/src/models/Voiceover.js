import mongoose from "mongoose";

const voiceoverSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    audioUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Voiceover", voiceoverSchema);