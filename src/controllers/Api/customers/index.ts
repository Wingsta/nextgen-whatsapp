/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { NextFunction, Request, Response } from "express";
import {
    sendSuccessResponse,
    sendErrorResponse
} from "../../../services/response/sendresponse";
import Profile from "../../../models/profile";
import moment = require("moment");
import { replaceSpecialChars } from "../../../utils/constants";


class Customers {

    public static async getCustomers(req: Request, res: Response, next: NextFunction) {
        try {
            let searchTerm = req.query.searchTerm as string;
            let { companyId } = req.user as { companyId: string };
            let {
                limit = 10,
                offset = 0,
                sortBy = "createdAt",
                sortType = "asc",
                status,
                startDate,
                endDate,
            } = req.query as unknown as {
                limit: number;
                offset: number;
                sortBy: string;
                sortType: string;
                status: string;
                startDate: Date,
                endDate: Date,
            };

            if (limit) {
                limit = parseInt(limit.toString());
            }

            if (offset) {
                offset = parseInt(offset.toString());
            }
            let mongoQuery = { companyId } as any;

            mongoQuery["verified"] = true;

            if (status) {
                let statusTypes = status.split(",");
                mongoQuery["status"] = { $in: statusTypes };
            }
            if (searchTerm) {
                searchTerm = replaceSpecialChars(searchTerm);
                mongoQuery["$or"] = [
                    { name: new RegExp(searchTerm, "i") },
                    { mobile: new RegExp(searchTerm, "i") },
                    { email: new RegExp(searchTerm, "i") }
                ];
            }

            if (startDate) {
                if (!mongoQuery["$and"]) {
                    mongoQuery["$and"] = []
                }
                mongoQuery['$and'].push({
                    createdAt: {
                        $gte: moment(startDate).startOf("day").toDate(),
                    }
                })
            }

            if (endDate) {
                if (!mongoQuery["$and"]) {
                    mongoQuery["$and"] = []
                }
                console.log(moment(endDate).endOf("day").toDate())
                mongoQuery["$and"].push({
                    createdAt: {
                        $lte: moment(endDate).endOf("day").toDate(),
                    }
                });

            }

            let data = await Profile.find(mongoQuery)
                .sort([[sortBy, sortType === "asc" ? 1 : -1]])
                .skip(offset)
                .limit(limit)
                .lean();

            let count = await Profile.countDocuments(mongoQuery);

            return res.json(
                sendSuccessResponse({
                    data,
                    count
                })
            );
        } catch (error) {
            next(error);
        }
    }

    public static async getCustomerDetail(req: Request, res: Response, next: NextFunction) {
        try {

            let { companyId } = req.user as { companyId: string };
            
            let customerId = req.params.customerId as string;
            if (!customerId) {
                return res.json(sendErrorResponse("customerId missing"));
            }

            let mongoQuery = { companyId } as any;

            mongoQuery.verified = true;
            mongoQuery._id = customerId;
            
            let data = await Profile.findOne(mongoQuery).lean();

            console.log(mongoQuery)

            if (!data) {
                return res.json(sendErrorResponse("user not found!", 1727));
            }

            return res.json(
                sendSuccessResponse(data)
            );
        } catch (error) {
            next(error);
        }
    }
}

export default Customers;
