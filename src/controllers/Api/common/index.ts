/**
 * Refresh JWToken
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import * as json2csv from 'json2csv'
import { Request, Response, NextFunction } from "express";
import Locals from "../../../providers/Locals";
import { sendErrorResponse, sendSuccessResponse } from "../../../services/response/sendresponse";
import { replaceSpecialChars } from "../../../utils/constants";
import Messages from "../../../models/message";
import { IMessages } from "../../../interfaces/models/accountuser";
import MessagesLogs from "../../../models/messagelog";
import {contacts} from '../../../utils/contacts'
import * as fs from "fs";
import * as Papa from "papaparse";
import User from "../../../models/user";
import sharp = require("sharp");
import { uploadImage } from "../../../services/gcloud/upload";
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const COMPANY_NAME = "nextgen";
class CommonController {
  public static appendTimestampToFileName(fileName: string) {
    const timestamp = Date.now();
    const parts = fileName.split(".");
    const extension = parts.pop();
    const newFileName = parts.join(".") + "_" + timestamp + "." + extension;
    return newFileName;
  }
  public static async upload(req: Request, res: Response, next): Promise<any> {
    try {
      let myFile = req.file as any;
      let compress = req.query.compress;
      myFile.originalname = CommonController.appendTimestampToFileName(
        myFile.originalname
      );
      if (myFile?.mimetype?.startsWith("image/") && compress === "true") {
        let buffer = await sharp(myFile.buffer)
          .webp({ quality: 80 })
          .resize(2000, 2000, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0.0 },
          })
          .toBuffer();

        myFile = {
          buffer: buffer,
          originalname: `${path.parse(myFile.originalname).name}.webp`,
        };
      }
      // return res.json({name : myFile.originalname});

      const imageUrl = await uploadImage(myFile, `sociallink_${COMPANY_NAME}`);
      res.json(
        sendSuccessResponse({
          url: imageUrl,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next) {
    try {
      let body = req.body as { password: string };

      const password = body.password;

      if (!password || password !== Locals.config().password) {
        return res.json(sendErrorResponse("invalid password"));
      }

      const token = jwt.sign(
        {
          valid: true,
        },
        Locals.config().appSecret,
        {
          expiresIn: 60 * 60 * 30 * 10,
        }
      );

      return res.json(sendSuccessResponse({ token }));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async getQrCode(req: Request, res: Response, next) {
    try {
      let user = await User.findOne({ name: COMPANY_NAME });

      return res.json(sendSuccessResponse({ user }));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async getMessage(req: Request, res: Response, next) {
    try {
      let searchTerm = req.query.searchTerm as string;

      let {
        limit = 10,
        offset = 0,
        sortBy = "createdAt",
        sortType = "desc",
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        sortType: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = {} as any;

      if (searchTerm) {
        searchTerm = replaceSpecialChars(searchTerm);
        mongoQuery["$or"] = [
          { sku: new RegExp(searchTerm, "i") },
          { name: new RegExp(searchTerm, "i") },
        ];
      }

      let messages = await Messages.find({
        ...mongoQuery,
      })
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .lean();

      let messageCount = await Messages.count({
        ...mongoQuery,
      }).lean();

      return res.json(sendSuccessResponse({ messages, count: messageCount }));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async getContacts(req: Request, res: Response, next) {
    try {
      return res.json(sendSuccessResponse({ contacts }));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async postMessage(req: Request, res: Response, next) {
    try {
      let message = req.body as IMessages;
      message.media = {
        urls: message.media || [],
      };

      if (!message || !message.message) {
        return res.json(sendErrorResponse("invalid message"));
      }

      let messageSaved = await new Messages({
        ...message,
      }).save();

      return res.json(sendSuccessResponse({ message: messageSaved }));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async downloadJSON(req: Request, res: Response, next) {
    try {
      let id = req.params.id;

      if (!id) {
        return res.json(sendErrorResponse("invalid id"));
      }

      let message = await Messages.findById(id).lean();

      if (!message.contacts?.length) {
        return res.json(sendErrorResponse("No contacts where selected"));
      }

      if(req.query.download){
          const csvData = json2csv.parse(
            message?.contacts?.map((it) => ({ ...it, status: !!it.status })),
            {
              fields: ["contact","companyName","name","place", "status"],
            }
          );

          // res.setHeader("Content-disposition", "attachment; filename=mydata.csv");

          res.contentType("text/csv");
          return res.send(Buffer.from(csvData));
      }

      return res.json(
        sendSuccessResponse(
          message?.contacts?.map((it) => ({ ...it, status: !!it.status })) || []
        )
      );
    } catch (error) {}
  }

  
}



export default CommonController;
