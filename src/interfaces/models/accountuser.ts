/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface IAccountUser {
  _id: Types.ObjectId;
  email: string;

  companyId: Types.ObjectId;
  password: string;
  website: string;
  name: string;
  mobile : string;
  
}

export interface IUser {
  name: String;
  qrcode: String;
}

export interface IMessages {
  message: String;
  media: Object;
  meta: Object;
  processed: Boolean;
  lock: Boolean;
}

export interface IMessagesLogs {
  contact: String;
  status: Object;
  meta: Object;
  messageId: Types.ObjectId;
}