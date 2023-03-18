/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
 import { Types } from "mongoose";


 export interface IMessage {
   _id: Types.ObjectId;
   message: string;
   userId: Types.ObjectId;
   companyId: Types.ObjectId;
   productId?: Types.ObjectId;
   productDetails?: any
}
 