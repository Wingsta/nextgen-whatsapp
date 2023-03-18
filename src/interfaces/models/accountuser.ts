/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface IAccountUser {
  _id: Types.ObjectId;
  email: string;

  companyId: Types.ObjectId;
  password: string;
  website: string;
  name: string;
  mobile : string;
  
}

export interface ICompany {
  _id: Types.ObjectId;
  companyName: string;
  meta: { [key: string]: any };
  razorpayAppId?: string;
  razorpaySecretKey?: string;
  promoCode: string;
  sms: {
    value: number;
    totalUsed: number;
    totalCredits: number;
  };
  whatsapp: {
    value: number;
    totalUsed: number;
    totalCredits: number;
  };
}

export type TransactionStatusT =
  | "CREATED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "PROCESSING" | string;

export type TransactionStatusConstantT = "IN"| "OUT" | "REFUND" | string;

export type TransactionGatewayT = "RAZORPAY" | string;

export interface ITranscationLogs {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  status: TransactionStatusT;
  razorpayPaymentId: string;
  returnData: any;
  item: {
    type: "SMS" | "WHATSAPP";
    value: number;
    credits: number;
  }[];
  totalAmount: number;
  transactionStatus: TransactionStatusConstantT;
  gateway: TransactionGatewayT;
  mode: string;
  orderId: string;
}

export interface IMessageLogs {
  type: "SMS" | "WHATSAPP";
  message: string;
  phoneNumber: string;
  creditsUsed: string;
  actualSpent: string;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
}


