

import { IConfiguration } from "../interfaces/models/configuration";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";
import { configurationTypes } from "../utils/constants";

// Create the model schema & register your custom methods here

// Define the Configuration Schema
export const ConfigurationSchema = new mongoose.Schema<IConfiguration>(
    {
        companyId: { type: Types.ObjectId, ref: "Company" },
        type: {
            type: String,
            enum: Object.keys(configurationTypes)
        },
        data: {
            type: Schema.Types.Mixed,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

const Configuration = mongoose.model<IConfiguration & mongoose.Document>("Configuration", ConfigurationSchema);

export default Configuration;