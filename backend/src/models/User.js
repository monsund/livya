import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    picture: String,
    googleId: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);