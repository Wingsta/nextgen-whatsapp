import * as Joi from "joi";
import { messageType, messageTypeConstant } from "../../../utils/constants";

export const validateMessage = (input: any) => {

    let message = {
        name: Joi.string().required(),
        mobile: Joi.string().min(13).max(13).required(),
        message: Joi.string().max(1000).required(),
        type: Joi.string().valid(...messageTypeConstant).required(),
    } as any;

    if (input?.type === messageType.ENQUIRY) {
        message.productId = Joi.string().required();
        message.productDetails = Joi.object().required();
    }

    const schema = Joi.object(message);
    
    return schema.validate(input);
};