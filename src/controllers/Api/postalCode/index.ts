import { NextFunction, Request, Response } from "express";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../../services/response/sendresponse";
import PostalCode from "../../../models/postalCode";
import { validatePostalcode } from "./utils"

class PostalCodes {

    public static async getPostalCode(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validatePostalcode(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let {
                type,
                data
            } = req.body;

            data = new RegExp(data, "i")

            let postalData = []

            if (type === "PINCODE") {

                postalData = await PostalCode.find({
                    $expr: {
                        $regexMatch: {
                           input: { $toString: "$pincode" }, 
                           regex: data
                        }
                    }
                }).sort({ officeName: 1 }).skip(0).limit(25);
                
            } else if (type === "ZONE") {
                
                // postalData = await PostalCode.find({
                //     $or: [
                //         { officeName: data },
                //         { taluk: data },
                //         { districtName: data },
                //         { stateName: data }
                //     ]
                // }).sort({ officeName: 1 });

                postalData = await PostalCode.aggregate([
                    {
                        $match: {
                            districtName: data
                        }
                    },
                    {
                        $project: {
                            districtName: 1,
                            pincode: 1
                        }
                    },
                    {
                        $group: {
                            _id: "$districtName",
                            data: { $push: "$$ROOT" }
                        }
                    },
                ])

            }

            return res.json(sendSuccessResponse(postalData, "Postal code data!"));
        } catch (error) {
            next(error);
        }
    }
}

export default PostalCodes;
