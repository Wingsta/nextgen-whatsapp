/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { ICategory } from "../interfaces/models/category";
import mongoose from "../providers/Database";
import { Types } from "mongoose";

// Create the model schema & register your custom methods here


// Define the Message Schema
export const CategorySchema = new mongoose.Schema<ICategory>(
   {
      name: { type: String },
      companyId: { type: Types.ObjectId, ref: "Company" },
      productCount: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: null }
   },
   {
      timestamps: true,
   }
);

const Category = mongoose.model<ICategory & mongoose.Document>("Category", CategorySchema);

export default Category;
