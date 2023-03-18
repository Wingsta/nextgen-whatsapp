/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export type IVariant = {
  _id?: Types.ObjectId;
  sku: string;
  price: number;
  originalPrice: number;
  quantity: number;
  thumbnail: string;
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
  outOfStock: boolean;
};

export interface IProducts {
	_id?: Types.ObjectId;
	companyId: Types.ObjectId;
	name: string;
	price: number;
	originalPrice: number;
	status: number;
	sku: string;
  	slug: string;
	quantity: number;
	addedDate: Date;
	thumbnail: string;
	carouselImages: string[];
	categoryId?: Types.ObjectId;
	posts: any[];
	productVersion: string;
	description: string;
	productUnitCount: number;
	productUnitLabel: string;
	variants?: IVariant[];
	enquiry?: boolean;
}


