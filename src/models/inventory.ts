/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IInventory } from "../interfaces/models/inventory"
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

const productSchema = new mongoose.Schema({
  productId: { type: Types.ObjectId, ref: "Product" },
  count: { type: Number },
  purchasePrice: { type: Number },
  skuId: { type: String },
  variantSKUId: { type: String },
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
});



// Define the Profile Schema
export const InventorySchema = new mongoose.Schema<IInventory>(
  {
    companyId: { type: Types.ObjectId, ref: "Company" },

    userId: { type: Types.ObjectId, ref: "AccountUser" },
    customerName: { type: String },
    address: { type: String },
    gstin: { type: String },
    invoice: { type: String },
    total: { type: Number },
    contactPersonName: { type: String },
    contactPersonNumber: { type: String },
    purchaseDate: { type: Date },
    products: [productSchema],
    status: {
      type: String,
    },
    notes: { type: String },
    invoiceNumber: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Iventory = mongoose.model<IInventory & mongoose.Document>(
  "Inventory",
  InventorySchema
);

export default Iventory;
