/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";
import { IAddress } from "./profile";



export interface IOrderHistory {
  _id: Types.ObjectId;

  
  orderId: Types.ObjectId;

  status:
    | "PROCESSING"
    | "PAYMENT_PROCESSING"
    | "CONFIRMED"
    | "REJECTED"
    | "CANCELLED"
    | 'PAYMENT_FAILED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'RETURNED'
    | 'DELIVERY_CANCELLED'
    | string;
  
  
  
  message : string;
  
}
