/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */


import { IPosts } from "../interfaces/models/posts";
import mongoose from "../providers/Database";
import { Types } from "mongoose";

// Create the model schema & register your custom methods here

// Define the User Schema
export const PostSchema = new mongoose.Schema<IPosts>(
  {
    name: { type: String },
    id: { type: String },
    media_type: { type: String },
    image_url: { type: Array },
    caption: { type: String },
    createdTime: { type: Date },
    companyId: { type: Types.ObjectId },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model<IPosts & mongoose.Document>("Post", PostSchema);

export default Post;
