/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";
import { IAddress } from "./profile";

export interface IOrderProducts {
  name: string;
  sku: string;
  quantity: string;
  thumbnail: string;
  productId: Types.ObjectId;
  price: number;
  variantSKU: string;
  size: {
    label: string;
    value: string;
    alias: string;
  };
  color: {
    label: string;
    value: string;
    alias: string;
  };
}

export interface IOrder {
	_id: Types.ObjectId;
	orderId : string;
	orderNumber : number;
	products: IOrderProducts[];
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
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
	deliveryAddress: IAddress;
	total: number;
	tax: number;
	delivery: number;
	totalAfterTax: number;
	paymentMethod: "CARD" | "CASH" | "UPI" | "NET-BANKING" | "FREE";
	mode: string;
	razorpayOrderId?: string,
	razorpayPaymentId?: string,
	returnData?: Object;
	selfPickup: boolean;
	createdAt: string;
	updatedAt: string;
}
