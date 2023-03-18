
import { Types } from "mongoose";

export interface ICustomAmount {
    min: number,
    max: number,
    deliveryCharge: number
}

export interface IDelivery {
    _id: Types.ObjectId;
    companyId: Types.ObjectId;

    deliveryZone: string,
    pincode: string[],

    deliveryFee: string,
    flatFeeType: string,
    flatFeeAmount: number,
    customAmount: ICustomAmount[],

    selfPickup: boolean
}
