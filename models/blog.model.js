import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverimage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", userSchema);
