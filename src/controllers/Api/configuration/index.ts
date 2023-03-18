import { NextFunction, Request, Response } from "express";
import Configuration from "../../../models/configuration";
import {
	sendErrorResponse,
	sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { validateTermsAndCondition, validatePrivacyPolicy, validateNotificationConfiguration } from "./utils";
import Domain from "../../../models/domain";
import { configurationTypes, notificationConfigConstant } from "../../../utils/constants";


class Configurations {

	public static async getPublicConfiguration(req: Request, res: Response, next: NextFunction) {
		try {

			let { companyId } = req.body.domain as { companyId: string };

			const { configurationType: type } = req.params as { configurationType: string };

			const data = await Configuration.findOne({
				companyId,
				type
			})

			let enabled = false;

			if (type === configurationTypes.TERMS_AND_CONDITIONS) {
				enabled = req.body.domain?.metaData?.termsAndConditions || false;
			} else if (type === configurationTypes.PRIVACY_POLICY) {
				enabled = req.body.domain?.metaData?.privacyPolicy || false;
			}

			return res.json(
				sendSuccessResponse({
					enabled,
					data
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public static async getTermsAndConditions(req: Request, res: Response, next: NextFunction) {
		try {

			let { companyId } = req.user as { companyId: string };

			const meta = await Domain.findOne({ companyId });

			const data = await Configuration.findOne({
				companyId,
				type: configurationTypes.TERMS_AND_CONDITIONS
			})

			return res.json(
				sendSuccessResponse({
					enabled: meta?.metaData?.termsAndConditions || false,
					data
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public static async getNotificationConfiguration(req: Request, res: Response, next: NextFunction) {
		try {

			let { companyId } = req.user as { companyId: string };

			let data = {} as any;

			data = await Configuration.findOne({
				companyId,
				type: configurationTypes.NOTIFICATION
			})

			data = data?.data || {};

			data = {
				...notificationConfigConstant,
				...data
			}

			return res.json(
				sendSuccessResponse(data)
			);
		} catch (error) {
			next(error);
		}
	}

	public static async postTermsAndConditions(req: Request, res: Response, next: NextFunction) {
		try {

			const { error } = validateTermsAndCondition(req.body);

			if (error) {
				return res.status(400).send(sendErrorResponse(error.details[0].message));
			}

			let { companyId } = req.user as { companyId: string };

			let { data, termsAndConditions } = req.body as { data: any, termsAndConditions: boolean};

			let domain = await Domain.findOne({ companyId }).lean();

			if (domain) {
				await Domain.updateOne(
					{ _id: domain?._id },
					{ $set: { metaData: { ...domain?.metaData, termsAndConditions } } }
				);
			}

			await Configuration.findOneAndUpdate({
				companyId,
				type: configurationTypes.TERMS_AND_CONDITIONS
			}, { type: configurationTypes.TERMS_AND_CONDITIONS, data }, { upsert: true })

			return res.json(sendSuccessResponse(null, "Terms and Conditions updated successfully!"));
		} catch (error) {
			next(error);
		}
	}

	public static async getPrivacyPolicy(req: Request, res: Response, next: NextFunction) {
		try {

			let { companyId } = req.user as { companyId: string };

			const meta = await Domain.findOne({ companyId });

			const data = await Configuration.findOne({
				companyId,
				type: configurationTypes.PRIVACY_POLICY
			})

			return res.json(
				sendSuccessResponse({
					enabled: meta?.metaData?.privacyPolicy || false,
					data
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public static async postPrivacyPolicy(req: Request, res: Response, next: NextFunction) {
		try {

			const { error } = validatePrivacyPolicy(req.body);

			if (error) {
				return res.status(400).send(sendErrorResponse(error.details[0].message));
			}

			let { companyId } = req.user as { companyId: string };

			let { data, privacyPolicy } = req.body as { data: any, privacyPolicy: boolean};

			let domain = await Domain.findOne({ companyId }).lean();

			if (domain) {
				await Domain.updateOne(
					{ _id: domain?._id },
					{ $set: { metaData: { ...domain?.metaData, privacyPolicy } } }
				);
			}

			await Configuration.findOneAndUpdate({
				companyId,
				type: configurationTypes.PRIVACY_POLICY
			}, { type: configurationTypes.PRIVACY_POLICY, data }, { upsert: true })

			return res.json(sendSuccessResponse(null, "Privacy policy updated successfully!"));
		} catch (error) {
			next(error);
		}
	}

	public static async postNotificationConfiguration(req: Request, res: Response, next: NextFunction) {
		try {

			const { error } = validateNotificationConfiguration(req.body);

			if (error) {
				return res.status(400).send(sendErrorResponse(error.details[0].message));
			}

			let { companyId } = req.user as { companyId: string };

			let { data } = req.body as { data: any, privacyPolicy: boolean};

			data = {
				...notificationConfigConstant,
				...data
			}

			await Configuration.findOneAndUpdate({
				companyId,
				type: configurationTypes.NOTIFICATION
			}, { type: configurationTypes.NOTIFICATION, data }, { upsert: true })

			return res.json(sendSuccessResponse(null, "Notification configuration updated successfully!"));
		} catch (error) {
			next(error);
		}
	}
}

export default Configurations; 