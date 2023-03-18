import * as Joi from "joi";

export const validateCategory = (input: object) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        isActive: Joi.boolean().required()
    });
    
    return schema.validate(input);
};

export const validateDuplicateCategory = (input: object) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        editId: Joi.string().allow(null, '').optional(),
    });
    
    return schema.validate(input);
};