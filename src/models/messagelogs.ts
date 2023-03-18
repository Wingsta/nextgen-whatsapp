/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { IMessageLogs } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';
import { Types ,Schema} from 'mongoose';

// Create the model schema & register your custom methods here


// Define the User Schema
export const MessageLogsSchema = new mongoose.Schema<IMessageLogs>(
  {
    type: { type: String, enum: ["SMS", "WHATSAPP"] },
    message: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    creditsUsed: {
      type: String,
    },
    actualSpent: {
      type: String,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountUser" },
  },
  {
    timestamps: true,
  }
);



const MessageLogs = mongoose.model<IMessageLogs & mongoose.Document>(
  "MessageLog",
  MessageLogsSchema
);

export default MessageLogs;
