/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";

export interface IAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  default: boolean;
  country: boolean;
}
export interface IUserProfile {
  _id: Types.ObjectId;
  mobile: string;
  name : string;
  companyId: Types.ObjectId;
  email: string;
  otp : number;
  address: IAddress[];
  verified: Boolean;
}
