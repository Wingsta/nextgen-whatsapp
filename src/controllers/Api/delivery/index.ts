import { NextFunction, Request, Response } from "express";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../../services/response/sendresponse";
import Delivery from "../../../models/delivery";
import { validateDeliverySetting } from "./utils";

class DeliverySettings {

    public static async getDeliverySettings(req: Request, res: Response, next: NextFunction) {
        try {

            let { companyId } = req.user as { companyId: string };

            const data = await Delivery.findOne({ companyId });

            return res.json(sendSuccessResponse(data, "Delivery settings!"));
        } catch (error) {
            next(error);
        }
    }

    public static async saveDeliverySettings(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validateDeliverySetting(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let { companyId } = req.user as { companyId: string };

            let {
                deliveryZone,
                pincode,
        
                deliveryFee,
                flatFeeType,
                flatFeeAmount,
        
                customAmount,

                selfPickup
            } = req.body;

            await Delivery.findOneAndUpdate({
                companyId
            }, {
                companyId,
                deliveryZone,
                pincode,
                deliveryFee,
                flatFeeType,
                flatFeeAmount,
                customAmount,
                selfPickup
            },{ upsert: true })

            return res.json(sendSuccessResponse(null, "Delivery settings updated successfully!"));
        } catch (error) {
            next(error);
        }
    }
}

export default DeliverySettings;
