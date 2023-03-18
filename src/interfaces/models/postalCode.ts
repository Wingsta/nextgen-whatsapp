
import { Types } from "mongoose";


export interface IPostalCode {
    _id: Types.ObjectId;
    officeName: number,
    pincode: string,
    officeType: string,
    deliveryStatus: string,
    divisionName: string,
    regionName: string,
    circleName: string,
    taluk: string,
    districtName: string,
    stateName: string,
    country: string,
    countryCode: string,
}
