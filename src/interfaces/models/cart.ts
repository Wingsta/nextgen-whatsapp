/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface ICart {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  quantity: number;
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
