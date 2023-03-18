/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
// import fetch from "node-fetch";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";

import axios, { AxiosRequestConfig } from "axios";

import * as XLSX from "xlsx";
import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";
import {
	sendErrorResponse,
	sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { uploadImage } from "../../../services/gcloud/upload";
import Domain from "../../../models/domain";
import { IDomain } from "../../../interfaces/models/domains";
import Profile from "../../../models/profile";
import { IAddress, IUserProfile } from "../../../interfaces/models/profile";
import { authorizedMobile } from "../common/constants";

class ProfileController {
	public static async getProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let { companyId, id } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}

			let profileDetails = await Profile.findOne({
				_id: id,
				companyId: companyId,
			});
			if (profileDetails?._id) {
				const token = jwt.sign(
					{
						name: profileDetails?.name,
						mobile: profileDetails.mobile,
						id: profileDetails?._id,
						companyId: companyId,
					},
					Locals.config().profileSecret,
					{
						expiresIn: 60 * 60 * 30,
					}
				);
				return res.json(
					sendSuccessResponse({
						message: "account created",
						token: token,
						profileDetails,
					})
				);
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}
	public static async postProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let domain = req.body.domain as IDomain;
			let mobile = req.body.mobile;
			let otp = req.body.otp;

			if (!domain) {
				return res.json(sendErrorResponse("domainId needed"));
			}

			if (!mobile) {
				return res.json(sendErrorResponse("mobileNumber needed"));
			}

			let profile = await Profile.findOne({
				mobile: mobile,
				companyId: domain?.companyId,
			}).lean();

			if (!otp || (profile.otp !== parseInt(otp))) {
				return res.json(sendErrorResponse("otp missing/incorrect"));
			}

			if (!profile?._id) {
				return res.json(sendErrorResponse("profile not found"));
			}

			if (profile?._id) {
				await Profile.updateOne(
					{ _id: profile._id },
					{
						$set:
						{
							otp: undefined,
							verified: true
						}
					},
					{ upsert: true }
				);
				const token = jwt.sign(
					{
						name: profile?.name,
						mobile: profile.mobile,
						id: profile?._id,
						companyId: domain?.companyId,
					},
					Locals.config().profileSecret,
					{
						expiresIn: 60 * 60 * 30,
					}
				);
				return res.json(
					sendSuccessResponse({
						message: "account created",
						token: token,
						profile,
					})
				);
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async patchProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let profile = (req.user as any)?.id as string;
			let companyId = (req.user as any)?.companyId as string;
			let profilePatchDetails = req.body.profile as IUserProfile;

			if (!profile || !profilePatchDetails) {
				return res.json(sendErrorResponse("profileId needed"));
			}

			let profileDetails = await Profile.findOne({
				_id: profile,
				companyId: companyId,
			}).lean();

			if (profileDetails?._id) {
				let id = profileDetails?._id;
				delete profileDetails._id;
				delete profileDetails.__v;

				let update = await Profile.updateOne(
					{ _id: id },
					{ $set: { ...profileDetails, ...profilePatchDetails } },
					{ upsert: true }
				);

				if (!!update.ok)
					return res.json(
						sendSuccessResponse({
							message: "account updated",
							_id: id,
							profileDetails: { ...profileDetails, ...profilePatchDetails },
						})
					);
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async postAddress(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let profile = (req.user as any)?.id as string;

			let address = req.body.address as IAddress;

			if (!address) {
				return res.json(sendErrorResponse("address needed"));
			}

			if (profile) {
				let id = profile;

				if (address.default) {
					await Profile.updateOne(
						{
							_id: id,
							"address.default": { $exists: true },
						},
						{ $set: { "address.$.default": false } }
						//  { upsert: true }
					);
				}

				let update = await Profile.updateOne(
					{ _id: id },
					{ $push: { address } },
					{ upsert: true }
				);

				if (!!update.ok)
					return res.json(
						sendSuccessResponse({
							message: "address added",
						})
					);
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async patchAddress(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let profile = (req.user as any)?.id as string;
			let addressId = req.params.addressId as string;
			let address = req.body.address as IAddress;

			if (!address) {
				return res.json(sendErrorResponse("address needed"));
			}

			if (!addressId) {
				return res.json(sendErrorResponse("addressId needed"));
			}

			if (profile) {
				let id = profile;

				if (address.default) {
					await Profile.updateOne(
						{ _id: id, address: { $exists: true } },
						{ $set: { "address.$.default": false } },
						{ upsert: true }
					);
				}

				let update = await Profile.updateOne(
					{ _id: id, "address._id": addressId },
					{ $set: { "address.$": { _id: addressId, ...address } } },
					{ upsert: true }
				);

				if (!!update.ok)
					return res.json(
						sendSuccessResponse({
							message: "address updated",
						})
					);
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async verifyProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let domain = req.body.domain as IDomain;
			let mobile = req.params.mobile;

			if (!domain) {
				return res.json(sendErrorResponse("domainId needed"));
			}

			if (!mobile) {
				return res.json(sendErrorResponse("mobileNumber needed"));
			}
			let otp = Math.floor(100000 + Math.random() * 900000);

			let authorized = authorizedMobile.indexOf(mobile) >= 0 ? true : false;

			if (authorized) {
				otp = 321456;
			}

			let profile = await Profile.findOne({
				mobile: mobile,
				companyId: domain?.companyId,
			}).lean();

			if (!profile?._id) {
				profile = await new Profile({
					mobile: mobile,
					companyId: domain?.companyId,
					otp,
				}).save();
			} else if (profile?._id) {
				await Profile.updateOne(
					{
						mobile: mobile,
						companyId: domain?.companyId,
					},
					{ $set: { otp } },
					{ upsert: true }
				);
			}

			if (authorized) {
				return res.json(sendSuccessResponse({ message: "otp sent" }));
			}

			const response = await axios(
				`https://2factor.in/API/R1/?module=TRANS_SMS&apikey=84b62449-9f5a-11eb-80ea-0200cd936042&to=${mobile}&from=SPRMCN&templatename=saravanan_code_2&var1=${domain?.metaData?.logoText || domain?.name
				}&var2=${otp}`
			);
			let status = response?.data?.Status === "Success";

			if (status) return res.json(sendSuccessResponse({ message: "otp sent" }));
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async checkMobile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			let { companyId } = req.user as { companyId: string };
			let mobile = req.params.mobile;

			if (!mobile) {
				return res.json(sendErrorResponse("mobileNumber needed"));
			}

			let profile = await Profile.findOne({
				mobile: mobile,
				companyId,
			}).lean();

			return res.json(
                sendSuccessResponse(profile)
            );
		} catch (error) {
			next(error);
		}
	}
}
export default ProfileController;
