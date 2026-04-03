import mongoose from "mongoose";

const extractionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    fields: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Extraction", extractionSchema);