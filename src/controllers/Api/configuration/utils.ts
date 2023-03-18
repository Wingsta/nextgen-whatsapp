import * as Joi from "joi";
import { configurationTypes } from "../../../utils/constants";

export const validateTermsAndCondition = (input: object) => {
    const schema = Joi.object({
        // type: Joi.string().valid(...Object.values(configurationTypes)).required(),
        data: Joi.any(),
        termsAndConditions: Joi.boolean()
    });
    
    return schema.validate(input);
};

export const validatePrivacyPolicy = (input: object) => {
    const schema = Joi.object({
        // type: Joi.string().valid(...Object.values(configurationTypes)).required(),
        data: Joi.any(),
        privacyPolicy: Joi.boolean()
    });
    
    return schema.validate(input);
};

export const validateNotificationConfiguration = (input: object) => {
    const schema = Joi.object({
        data: Joi.any()
    });
    
    return schema.validate(input);
};