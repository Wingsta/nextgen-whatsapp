/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IMessage } from "../interfaces/models/message";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

// Create the model schema & register your custom methods here


// Define the Message Schema
export const MessageSchema = new mongoose.Schema<IMessage>(
    {
        message: { type: String },
        userId: { type: Types.ObjectId, ref: "Profile" },
        companyId: { type: Types.ObjectId, ref: "Company" },
        productId: { type: Types.ObjectId, ref: "Product" },
        type: { type: String },
        productDetails: {
            type: Schema.Types.Mixed,
            default: () => ({}),
        }
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model<IMessage & mongoose.Document>("Message", MessageSchema);

export default Message;
