import * as Joi from "joi";
import { deliveryFeeConstants, deliveryFlatFeeConstants, deliveryZoneConstants } from "../../../utils/constants";

export const validateDeliverySetting = (input: object) => {

    const customAmount = Joi.object({
        min: Joi.number().required(),
        max: Joi.number().allow("", null).required(),
        deliveryCharge: Joi.number().required()
    });

    const schema = Joi.object({
        deliveryZone: Joi.string().valid(...Object.values(deliveryZoneConstants)).required(),
        pincode: Joi.array().items(Joi.string().optional()).required(),

        deliveryFee: Joi.string().valid(...Object.values(deliveryFeeConstants)).required(),
        flatFeeType: Joi.string().allow("", null).valid(...Object.values(deliveryFlatFeeConstants)).required(),
        flatFeeAmount: Joi.number().allow("", null).required(),

        customAmount: Joi.array().items(customAmount).required(),

        selfPickup: Joi.boolean().required()
    });
    
    return schema.validate(input);
};