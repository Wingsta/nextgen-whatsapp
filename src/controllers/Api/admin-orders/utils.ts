import * as Joi from "joi";

export const validateOfflineOrder = (input: object) => {
    const schema = Joi.object({
      name: Joi.string().allow(null, "").optional(),
      mobile: Joi.string().min(13).max(13).required(),
      total: Joi.number().required(),
      products: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            sku: Joi.string().allow(null, "").optional(),
            variantSKU: Joi.string().allow(null, "").optional(),
            size: Joi.object({ label: Joi.string(), value: Joi.string() })
              .allow(null, "")
              .optional(),
            color: Joi.object({ label: Joi.string(), value: Joi.string(), alias : Joi.string() })
              .allow(null, "")
              .optional(),
            quantity: Joi.number().required(),
            thumbnail: Joi.string().allow(null, "").optional(),
            productId: Joi.string().required(),
            price: Joi.number().required(),
          })
        )
        .optional()
        .allow(null, ""),
    });
    
    return schema.validate(input);
};