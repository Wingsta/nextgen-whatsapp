/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { ICart } from "../interfaces/models/cart";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

// Create the model schema & register your custom methods here


// Define the Profile Schema
export const CartSchema = new mongoose.Schema<ICart>(
  {
    companyId: { type: Types.ObjectId, ref: "Company" },
    mobile: { type: String },
    sku: { type: String },
    name: { type: String },
    productId: { type: Types.ObjectId, ref: "Product" },
    userId: { type: Types.ObjectId, ref: "Profile" },
    quantity: { type: Number },
    variantSKU: { type: String },
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
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model<ICart & mongoose.Document>("Cart", CartSchema);

export default Cart;
