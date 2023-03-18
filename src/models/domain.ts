/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IDomain } from "../interfaces/models/domains";
import mongoose from "../providers/Database";

// Create the model schema & register your custom methods here

// Define the User Schema
export const DomainSchema = new mongoose.Schema<IDomain>(
  {
    name: { type: String },
    companyId: { type: mongoose.Schema.Types.ObjectId },
    metaData: { type: Object },
    published : {type : Boolean, default : false}
  },
  {
    timestamps: true,
  }
);

const Domain = mongoose.model<IDomain & mongoose.Document>(
  "Domain",
  DomainSchema
);

export default Domain;
