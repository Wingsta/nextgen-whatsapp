/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";



export interface IInventory {
  _id: Types.ObjectId;

  customerName: string;
  address: string;
  gstin: string;
  invoice: string;
  total: number;
  contactPersonName: string;
  contactPersonNumber: string;
  purchaseDate: Date;
  products: {
    productId: string;
    count: number;
    purchasePrice: number;
    skuId: string;
    variantSKUId: string;
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
  }[];
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  status: "IN_STOCK" | "OUT_STOCK" | "RETURNED" | "CANCELLED" | string;
  invoiceNumber: string;
  notes: string;
}
