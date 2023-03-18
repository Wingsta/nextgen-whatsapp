import * as Joi from "joi";

export const validatePostalcode = (input: object) => {
    const schema = Joi.object({
        type: Joi.string().valid(...["PINCODE", "ZONE"]).required(),
        data: Joi.string().required()
    });
    
    return schema.validate(input);
};