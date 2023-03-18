/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { NextFunction, Request, Response } from "express";
import Message from "../../../models/message";
import { IMessage } from "../../../interfaces/models/message";
import { ObjectId } from "mongodb";

import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../../services/response/sendresponse";
import Profile from "../../../models/profile";
import { validateMessage } from "./utils";
import moment = require("moment");
import { replaceSpecialChars } from "../../../utils/constants";


class Messages {

    public static async postMessage(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validateMessage(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let { companyId } = req.user as { companyId: string };

            let { 
                name, 
                mobile, 
                message, 
                type,
                productId,
                productDetails
            } = req.body as { 
                name: string, 
                mobile: string,
                message: string,
                type: string,
                productId: string,
                productDetails: any
            };

            let timeInterval = moment().utcOffset('+05:30', true).subtract(24, 'hours').toDate()

            let profile = await Profile.findOne({
                mobile: mobile,
                companyId: companyId,
            }).lean();
        
            if (!profile?._id) {
                profile = await new Profile({
                    mobile: mobile,
                    companyId: companyId
                }).save();
            }

            const messages = await Message.find({ 
                createdAt: { $gte: timeInterval },
                userId: profile?._id,
                companyId,
                type,
                productId
            });

            if (messages.length > 1) {
                return res.json(sendSuccessResponse(null, "Message created successfully!"));
            }

            await new Message({
                message,
                userId: profile?._id,
                companyId,
                type,
                productId,
                productDetails
            }).save();

            return res.json(sendSuccessResponse(null, "Message created successfully!"));
        } catch (error) {
            next(error);
        }
    }

    public static async getAllMessages(req: Request, res: Response, next: NextFunction) {
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
                type
            } = req.query as unknown as {
                limit: number;
                offset: number;
                sortBy: string;
                sortType: string;
                status: string;
                startDate: Date,
                endDate: Date,
                type: string
            };

            if (limit) {
                limit = parseInt(limit.toString());
            }

            if (offset) {
                offset = parseInt(offset.toString());
            }
            let mongoQuery = { companyId } as any;

            if (type) {
                mongoQuery.type = type;
            }

            if (status) {
                let statusTypes = status.split(",");
                mongoQuery["status"] = { $in: statusTypes };
            }
            if (searchTerm) {
                searchTerm = replaceSpecialChars(searchTerm);
                mongoQuery["$or"] = [
                    { message: new RegExp(searchTerm, "i") }
                ];
            }

            if (startDate) {
                if (!mongoQuery["$and"]){
                   mongoQuery["$and"] = []
                }
                mongoQuery['$and'].push({createdAt : {
                    $gte: moment(startDate).startOf("day").toDate(),
                }})
            }
      
            if (endDate) {
                if (!mongoQuery["$and"]) {
                    mongoQuery["$and"] = []
                }
                console.log(moment(endDate).endOf("day").toDate())
                mongoQuery["$and"].push({createdAt : {
                    $lte: moment(endDate).endOf("day").toDate(),
                }});
                
            }

            let messages = await Message.find(mongoQuery)
                .sort([[sortBy, sortType === "asc" ? 1 : -1]])
                .populate('userId', { name: 1, mobile: 1, verified: 1, email: 1 })
                .skip(offset)
                .limit(limit)
                .lean();
            
            let count = await Message.countDocuments(mongoQuery);

            return res.json(
                sendSuccessResponse({
                    messages,
                    count
                })
            );
        } catch (error) {
            next(error);
        }
    }
}

export default Messages;
