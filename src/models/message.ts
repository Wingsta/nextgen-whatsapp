/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { IMessages } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here


// Define the User Schema
export const MessagesSchema = new mongoose.Schema<IMessages>(
  {
    message: { type: String },
    media: { type: Object },
    meta: { type: Object },
    processed: { type: Boolean, default: false },
    lock: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);



const Messages = mongoose.model<IMessages & mongoose.Document>(
  "Message",
  MessagesSchema
);

export default Messages;
