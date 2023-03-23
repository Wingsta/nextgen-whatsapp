/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { IMessagesLogs } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';
import { Types } from 'mongoose';

// Create the model schema & register your custom methods here


// Define the User Schema
export const MessagesLogsSchema = new mongoose.Schema<IMessagesLogs>(
  {
    contact: { type: String },
    status: { type: Object },
    meta: { type: String },
    messageId: { type: mongoose.Schema.Types.ObjectId },
  },
  {
    timestamps: true,
  }
);



const MessagesLogs = mongoose.model<IMessagesLogs & mongoose.Document>(
  "MessageLog",
  MessagesLogsSchema
);

export default MessagesLogs;
