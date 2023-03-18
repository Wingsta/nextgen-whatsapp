/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";

export interface IPosts {
  _id?: Types.ObjectId;
  companyId : Types.ObjectId;
  id: string;
  media_type: "POST" | "CAROUSEL";
  image_url: string | string[];
  caption: string;
  createdTime: Date;
  name: string;
}
