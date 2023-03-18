

import { IDelivery } from "../interfaces/models/delivery";
import mongoose from "../providers/Database";
import { Types } from "mongoose";

// Create the model schema & register your custom methods here

// Define the Delivery Schema
export const DeliverySchema = new mongoose.Schema<IDelivery>(
    {
        companyId: { type: Types.ObjectId, ref: "Company" },

        deliveryZone: { type: String },
        pincode: [{ type: String}],

        deliveryFee: { type: String },
        flatFeeType: { type: String },
        flatFeeAmount: { type: Number },
        customAmount: [{
            min: {
                type: Number
            },
            max: {
                type: Number
            },
            deliveryCharge: {
                type: Number
            }
        }],

        selfPickup: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

const Delivery = mongoose.model<IDelivery & mongoose.Document>("Delivery", DeliverySchema);

export default Delivery;
