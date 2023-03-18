/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { ICompany } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';
import { Types ,Schema} from 'mongoose';

// Create the model schema & register your custom methods here


// Define the User Schema
export const CompanySchema = new mongoose.Schema<ICompany>(
  {
    companyName: { type: String },
    meta: {
      buisnessAccountData: { type: Object },
      buisnessAccountId: { type: String },
      fbPageId: { type: String },
      subscriptions: { type: Object },
      fbPageAccessToken: { type: String },
      accessToken: { type: String },
      domainName: { type: String },
      domainId: { type: Types.ObjectId, ref: "Domain" },
    },
    razorpayAppId: { type: String },
    razorpaySecretKey: { type: String },
    promoCode: { type: String },
    sms: { type: Schema.Types.Mixed },
    whatsapp: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);



const Company = mongoose.model<ICompany & mongoose.Document>(
	"Company",
	CompanySchema
);

export default Company;
