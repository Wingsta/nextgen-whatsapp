/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IOrderHistory } from "../interfaces/models/orderhistory";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";




// Define the Profile Schema
export const OrderHistorySchema = new mongoose.Schema<IOrderHistory>(
  {
    


    orderId: { type: Types.ObjectId, ref: "Order" },
    status: { type: String },
    message: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const OrderHistory = mongoose.model<IOrderHistory & mongoose.Document>(
  "OrderHistory",
  OrderHistorySchema
);

export default OrderHistory;
