import * as Joi from "joi";

export const validateProduct = (input: object) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        isActive: Joi.boolean().required(),
        editId: Joi.string().allow(null, '').optional(),
    });
    
    return schema.validate(input);
};