/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IProducts, IVariant } from "../interfaces/models/products";
import mongoose from "../providers/Database";
import { Types } from "mongoose";
import { boolean } from "joi";

// Create the model schema & register your custom methods here

export const VariantSchema = new mongoose.Schema<IVariant>({
  sku: {
    type: String,
  },
  price: {
    type: Number,
  },
  originalPrice: {
    type: Number,
  },
  thumbnail: { type: String },
  quantity: {
    type: Number,
  },
  size: {
    label: {
      type: String,
    },
    value: {
      type: String,
    },
    alias: {
      type: String,
    },
  },
  color: {
    label: {
      type: String,
    },
    value: {
      type: String,
    },
    alias: {
      type: String,
    },
  },

  outOfStock: {
    type: Boolean,
    default: false,
  },
});

// Define the User Schema
export const ProductSchema = new mongoose.Schema<IProducts>(
  {
    companyId: { type: Types.ObjectId, ref: "Company" },
    name: { type: String },
    price: { type: Number },
    status: { type: Number },
    sku: { type: String },
    slug: { type: String },
    quantity: { type: Number },
    addedDate: { type: Date },
    thumbnail: { type: String },
    carouselImages: { type: Array },
    categoryId: { type: Types.ObjectId, ref: "Category" },
    posts: [{ type: Types.ObjectId, ref: "Post" }],
    productVersion : {type : String},
    originalPrice: { type: Number },
    description: { type: String },
    productUnitCount: { type: Number },
    productUnitLabel: { type: String },
    variants: [VariantSchema],
    createdAt: { type: Date },
    updatedAt: { type: Date },
    enquiry: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProducts & mongoose.Document>(
	"Product",
	ProductSchema
);

export default Product;
