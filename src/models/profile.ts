/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IUserProfile } from "../interfaces/models/profile";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

// Create the model schema & register your custom methods here

const Address = new Schema({
	name: { type: String },
	addressLine1: { type: String },
	addressLine2: { type: String },
	city: { type: String },
	state: { type: String },
	pincode: { type: String },
	landmark: { type: String },
	default: { type: Boolean, default: false },
	country: { type: String, default: "India" },
});
// Define the Profile Schema
export const ProfileSchema = new mongoose.Schema<IUserProfile>(
	{
		companyId: { type: Types.ObjectId, ref: "Company" },
		mobile: { type: String },
		name: { type: String },
		email: { type: String },
		otp: { type: Number },
		address: [Address],
		verified: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

const Profile = mongoose.model<IUserProfile & mongoose.Document>(
	"Profile",
	ProfileSchema
);

export default Profile;
