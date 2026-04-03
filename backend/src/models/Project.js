import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    status: {
      type: String,
      enum: ["processing", "completed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);