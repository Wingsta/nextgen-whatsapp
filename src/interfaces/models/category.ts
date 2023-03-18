/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface ICategory {
    _id: Types.ObjectId;
    name: string;
    productCount: number;
    companyId: Types.ObjectId;
    isActive: boolean,
    order: number
}
