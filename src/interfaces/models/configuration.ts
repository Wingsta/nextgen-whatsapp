
import { Types } from "mongoose";

export interface IConfiguration {
    _id: Types.ObjectId;
    companyId: Types.ObjectId;
    type: string;
    data: any;
    createdAt: string;
	updatedAt: string;
}
