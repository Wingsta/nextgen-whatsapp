/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";

// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectID, ObjectId } from "mongodb";
import axios from "axios";
import Company from "../../../models/company";
import {
	sendErrorResponse,
	sendResponse,
	sendSuccessResponse,
} from "../../../services/response/sendresponse";

interface ISignupGet extends IAccountUser, ICompany { }

const generateHash = async (plainPassword: string) => {
	const salt = bcrypt.genSaltSync(10);
	const hash = await bcrypt.hashSync(plainPassword, salt);
	return hash;
};
class AccountUserAuth {
	public static async login(req: Request, res: Response, next) {
		try {
			let body = req.body as ISignupGet & { type: "GOOGLE" };

			const email = body.email;

			if (!email) {
				return res.json({ error: "no email" });
			}

			let account = await AccountUser.findOne({
				email: body.email,
			}).lean();

			if (!account) {
				return res.json(sendErrorResponse("Account does not exist!", 1001));
			}

			if (body.type !== "GOOGLE" && !account.password) {
				return res.json(
					sendErrorResponse("Please user Google login for the given Email!")
				);
			}

			if (
				!body.type &&
				!(await bcrypt.compare(body.password, account.password))
			) {
				return res.json(sendErrorResponse("Incorrect Password!"));
			}

			if (
				body.type === "GOOGLE" ||
				!!(await bcrypt.compare(body.password, account.password))
			) {
				const token = jwt.sign(
					{
						email: body.email,
						name: body.name,
						companyId: account?.companyId,
						accountId: account?._id,
					},
					Locals.config().appSecret,
					{
						expiresIn: 60 * 60 * 30,
					}
				);

				let companyDetails = await Company.findOne({ _id: account?.companyId });

				return res.json(
					sendSuccessResponse({ account, token, company: companyDetails })
				);
			}

			return res.json(sendErrorResponse("login failed"));
		} catch (error) {
			console.log(error);
			next(error);
		}
	}

	public static async signup(req: Request, res: Response, next) {
		try {
			let body = req.body as ISignupGet & { type: "GOOGLE" };

			let company: ICompany;
			const email = body.email;

			if (!email) {
				return res.json(sendErrorResponse("no email"));
			}

			let isEmailExist = !!(await AccountUser.findOne({
				email: body.email,
			}).lean());

			if (isEmailExist) {
				return res.json(sendErrorResponse("email already exists"));
			}

			if (body.password && body.type !== "GOOGLE") {
				body.password = await generateHash(body.password);
			}

			if (body.companyName) {

				let companyDetails = {}

				if (body.promoCode) {
					companyDetails = {
						companyName: body.companyName,
						promoCode: body.promoCode
					}
				} else {
					companyDetails = {
						companyName: body.companyName
					}
				}

				company = await new Company(companyDetails).save();

				if (!company?._id) {
					return res.json(sendErrorResponse("company creation failed"));
				}

				body.companyId = new ObjectID(company?._id);
			}

			let accountuser = await new AccountUser(body).save();

			if (accountuser?._id) {
				const token = jwt.sign(
					{
						email: body.email,
						name: body.name,
						companyId: accountuser?.companyId,
						accountId: accountuser?._id,
					},
					Locals.config().appSecret,
					{
						expiresIn: 60 * 60 * 30,
					}
				);

				return res.json(
					sendSuccessResponse({ token, account: accountuser, company })
				);
			}
			return res.json(sendErrorResponse("signup failed"));
		} catch (error) {
			next(error);
		}
	}

	public static async resetPassword(req: Request, res: Response, next) {
		try {
			let { accountId } = req.user as { companyId: string; accountId: string };

			let { newPassword, oldPassword } = req.body;

			if (!newPassword) {
				return res.json(sendErrorResponse("New password needed", 1001));
			}

			if (!oldPassword) {
				return res.json(sendErrorResponse("Old password needed", 1001));
			}

			let account = await AccountUser.findOne({
				_id: new ObjectID(accountId),
			}).lean();

			if (!account) {
				return res.json(sendErrorResponse("Account not found"));
			}

			// if (
			// 	account.password &&
			// 	!(await bcrypt.compare(oldPassword, account.password))
			// ) {
			// 	return res.json(sendErrorResponse("Old Password is incorrect"));
			// }

			let password = await generateHash(newPassword);
			let accountUser = await AccountUser.updateOne(
				{ _id: accountId },
				{ $set: { password: password } },
				{ upsert: true }
			);

			if (accountUser?.ok) return res.json(sendSuccessResponse({}, "success"));
			else return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async getAccountUser(req: Request, res: Response, next) {
		try {
			let { accountId } = req.user as { companyId: string; accountId: string };

			let account = await AccountUser.findOne({
				_id: new ObjectID(accountId),
			}).lean();

			if (!account) {
				return res.json(sendErrorResponse("Account not found"));
			}

			if (account) return res.json(sendSuccessResponse(account, "success"));
			else return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async patchAccountUser(req: Request, res: Response, next) {
		try {
			let { accountId } = req.user as { companyId: string; accountId: string };

			let account = await AccountUser.findOne({
				_id: new ObjectID(accountId),
			}).lean();

			if (!account) {
				return res.json(sendErrorResponse("Account not found"));
			}

			let accountUpdateDoc = req.body as IAccountUser;

			if (!accountUpdateDoc) {
				return res.json(sendErrorResponse("body to update not found"));
			}

			delete accountUpdateDoc._id;
			delete accountUpdateDoc.password;
			delete accountUpdateDoc.companyId;

			if (accountUpdateDoc.mobile) {
				let checkExisting = await AccountUser.findOne({
					mobile: accountUpdateDoc.mobile,
					_id: { $ne: new ObjectId(accountId) },
				}).lean();

				if (checkExisting) {
					return res.json(
						sendErrorResponse("Phone number is aldready registered")
					);
				}
			}

			let accountUser = await AccountUser.updateOne(
				{ _id: accountId },
				{ $set: { ...accountUpdateDoc } },
				{ upsert: true }
			);

			if (accountUser?.ok) return res.json(sendSuccessResponse({}, "success"));
			else return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}
}

export default AccountUserAuth;
