

import { IPostalCode } from "../interfaces/models/postalCode";
import mongoose from "../providers/Database";

// Create the model schema & register your custom methods here

// Define the Postalcode Schema
export const PostalCodeSchema = new mongoose.Schema<IPostalCode>(
    {
        officeName: { type: String },
        pincode: { 
            type: Number,
            index: true
        },
        officeType: { 
            type: String,
            index: true
        },
        deliveryStatus: { type: String },
        divisionName: { type: String },
        regionName: { type: String },
        circleName: { type: String },
        taluk: { 
            type: String,
            index: true
        },
        districtName: { 
            type: String,
            index: true
        },
        stateName: { 
            type: String,
            index: true
        },
        country: { 
            type: String,
            default: "India"
        },
        countryCode: { 
            type: String,
            default: "IN"
        },
    },
    {
        timestamps: true,
    }
);

const PostalCode = mongoose.model<IPostalCode & mongoose.Document>("PostalCode", PostalCodeSchema);

export default PostalCode;
