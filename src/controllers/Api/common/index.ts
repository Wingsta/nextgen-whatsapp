/**
 * Refresh JWToken
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
const path = require("path");
import AccountUser from "../../../models/accountuser";
import Company from "../../../models/company";
import Locals from "../../../providers/Locals";
import {
  uploadImage,
  uploadImageForSocialLink,
  compressImages,
} from "../../../services/gcloud/upload";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import * as sharp from "sharp";
import { createRazorpayOrder, CREDIT_TYPES, ORDER_STATUS, PER_UNIT_CREDIT_COST, RAZORPAY_STATUS, RAZORPAY_TRANSCATION_GATEWAY, RAZORPAY_TRANSCATION_STATUS, roundOff } from "../../../utils/constants";
import TranscationLogs from "../../../models/transcationlogs";
import { LeanDocument, Document } from "mongoose";
import { ITranscationLogs } from "../../../interfaces/models/accountuser";
import MessageLogs from "../../../models/messagelogs";
const crypto = require("crypto");
const axios = require("axios");
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
      let { companyId } = req.user as { companyId: string };
      const imageUrl = await uploadImage(myFile, companyId);
      res.json(
        sendSuccessResponse({
          url: imageUrl,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async uploadForSocialLink(
    req: Request,
    res: Response,
    next
  ): Promise<any> {
    try {
      const myFile = req.file as any;
      let { companyId } = req.user as { companyId: string };
      const imageUrl = await uploadImageForSocialLink(myFile, companyId);
      res.json(
        sendSuccessResponse({
          url: imageUrl,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async createOrder(
    req: Request,
    res: Response,
    next
  ): Promise<any> {
    let { sms, whatsapp } = req.body as {
      sms: number;
      whatsapp: number;
    };
    let { companyId, accountId } = req.user as {
      companyId: string;
      accountId: string;
    };
    let { razorpayAppId, razorpaySecretKey } = Locals.config();

    // console.log(razorpayAppId, razorpaySecretKey, req.user);
    if (!razorpayAppId || !razorpaySecretKey) {
      return res.json(sendErrorResponse("no razorpay app id"));
    }

    let company = await Company.findById(companyId);

    if (!company.sms) {
      company.sms = {
        value: PER_UNIT_CREDIT_COST.SMS,
        totalUsed: 0,
        totalCredits: 0,
      };
    }

    if (!company.whatsapp) {
      company.whatsapp = {
        value: PER_UNIT_CREDIT_COST.WHATSAPP,
        totalUsed: 0,
        totalCredits: 0,
      };
    }

    let smsAmount = (sms || 0) * company.sms.value;
    let whatsappAmount = (whatsapp || 0) * company.whatsapp.value;
    let totalAmount = (smsAmount || 0) + (whatsappAmount || 0);
    let totalAmountAfterTax =
      totalAmount + totalAmount * PER_UNIT_CREDIT_COST.GST;
    totalAmountAfterTax = roundOff(totalAmountAfterTax, true);
    let notes = [
      { type: CREDIT_TYPES.SMS, value: PER_UNIT_CREDIT_COST.SMS, credits: sms },
      {
        type: CREDIT_TYPES.WHATSAPP,
        value: PER_UNIT_CREDIT_COST.WHATSAPP,
        credits: whatsapp,
      },
    ];
    const orderData = await createRazorpayOrder(
      razorpayAppId,
      razorpaySecretKey,
      +totalAmountAfterTax
      // notes
    );

    console.log(orderData);
    let razorpayData = {
      razorpayOrderId: orderData?.id,
      returnData: orderData,
    };

    if (razorpayData?.razorpayOrderId) {
      await new TranscationLogs({
        companyId,
        userId: accountId,
        status: RAZORPAY_STATUS.CREATED,
        razorpayPaymentId: razorpayData?.returnData?.receipt,
        returnData: razorpayData?.returnData,
        item: notes,
        totalAmount: totalAmountAfterTax,
        transactionStatus: RAZORPAY_TRANSCATION_STATUS.IN,
        gateway: RAZORPAY_TRANSCATION_GATEWAY.RAZORPAY,
        mode: "online",
        orderId: razorpayData?.razorpayOrderId,
      }).save();

      return res.json(sendSuccessResponse({ orderData: razorpayData }));
    }
  }

  public static async getOrder(
    req: Request,
    res: Response,
    next
  ): Promise<any> {
    let { companyId } = req.user as { companyId: string };

    let company = await Company.findById(companyId);

    if (!company.sms) {
      company.sms = {
        value: PER_UNIT_CREDIT_COST.SMS,
        totalUsed: 0,
        totalCredits: 0,
      };
    }

    if (!company.whatsapp) {
      company.whatsapp = {
        value: PER_UNIT_CREDIT_COST.WHATSAPP,
        totalUsed: 0,
        totalCredits: 0,
      };
    }

    return res.json(
      sendSuccessResponse({
        sms: company.sms,
        whatsapp: company.whatsapp,
        gst: PER_UNIT_CREDIT_COST.GST,
      })
    );
  }

  public static async updateRazorpayPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let razorpay_order_id = req.body.razorpay_order_id as string;

      let { razorpayAppId, razorpaySecretKey } = Locals.config();

      console.log(razorpayAppId, razorpaySecretKey);
      if (!razorpayAppId || !razorpaySecretKey) {
        return res.json(sendErrorResponse("no razorpay app id"));
      }
      let { companyId } = req.user as { companyId: string };

      if (!razorpay_order_id) {
        throw new Error("Razorpay order id is required!");
      }

      const company = await Company.findById(companyId);

      if (!company) {
        throw new Error("company details not found!");
      }

      const order = await TranscationLogs.findOne({
        orderId: razorpay_order_id,
      }).lean();

      if (!order) {
        throw new Error("order details not found!");
      }

      if (order?.status === RAZORPAY_STATUS.COMPLETED) {
        return res.json(
          sendSuccessResponse(null, "Payment status updated successfully!")
        );
      }

      const generatedSignature = crypto
        .createHmac("SHA256", razorpaySecretKey)
        .update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== req.body.razorpay_signature) {
        await TranscationLogs.findOneAndUpdate(
          {
            orderId: req.body.razorpay_order_id,
          },
          {
            status: RAZORPAY_STATUS.FAILED,
          }
        );

        return res.json(sendErrorResponse("Invalid Transaction!"));
      }

      let mode = "Others";

      // Get payment method from razorpay
      const paymentData = await axios.get(
        `https://${razorpayAppId}:${razorpaySecretKey}@api.razorpay.com/v1/payments/${req.body.razorpay_payment_id}/?expand[]=card`
      );
      if (paymentData?.data) {
        const { method } = paymentData.data;
        if (method) {
          switch (method) {
            case "card":
              if (paymentData.data.card) {
                const { type } = paymentData.data.card;
                if (type) {
                  if (type === "debit") {
                    mode = "Debit";
                  } else if (type === "credit") {
                    mode = "Credit";
                  }
                }
              }
              break;
            case "upi":
              mode = "UPI";
              break;
            case "netbanking":
              mode = "Netbanking";
              break;
            case "wallet":
              mode = "Wallet";
              break;
            case "emi":
            case "cardless_emi":
              mode = "EMI";
              break;
            default:
              break;
          }
        }

        if (paymentData?.data?.status === "captured") {
          await TranscationLogs.findOneAndUpdate(
            {
              orderId: razorpay_order_id,
            },
            {
              status: RAZORPAY_STATUS.COMPLETED,
              mode: mode,
              returnData: { ...order.returnData, ...req.body },
              razorpayPaymentId: req.body.razorpay_payment_id,
            }
          );

          await CommonController.updateOrderToCompany(order);
        } else if (paymentData?.data?.status === "failed") {
          await TranscationLogs.findOneAndUpdate(
            {
              razorpayOrderId: razorpay_order_id,
            },
            {
              status: RAZORPAY_STATUS.FAILED,
            }
          );
        }
      }

      return res.json(
        sendSuccessResponse(null, "Payment status updated successfully!")
      );
    } catch (error) {
      next(error);
    }
  }

  private static async updateOrderToCompany(
    order: LeanDocument<ITranscationLogs & Document<any, any, any>>
  ) {
    let { companyId } = order;
    const company = await Company.findById(companyId);

    if (!company) {
      throw new Error("Store details not found!");
    }

    await Company.findByIdAndUpdate(companyId, {
      sms: {
        ...(company.sms || {
          value: 0,
          totalUsed: 0,
          totalCredits: 0,
        }),
        value: company?.sms?.value || PER_UNIT_CREDIT_COST.SMS,
        totalCredits:
          (company?.sms?.totalCredits || 0) +
          order?.item?.find((it) => it.type === CREDIT_TYPES.SMS)?.credits,
      },
      whatsapp: {
        ...(company.whatsapp || {
          value: 0,
          totalUsed: 0,
          totalCredits: 0,
        }),
        value: company?.whatsapp?.value || PER_UNIT_CREDIT_COST.WHATSAPP,
        totalCredits:
          (company?.whatsapp?.totalCredits || 0) +
          order?.item?.find((it) => it.type === CREDIT_TYPES.WHATSAPP)?.credits,
      },
    });
  }

  public static async updateRazorpayPaymentWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { payload } = req.body;

      let { razorpayAppId, razorpaySecretKey } = Locals.config();

      if (!razorpayAppId || !razorpaySecretKey) {
        return res.json(sendErrorResponse("no razorpay app id"));
      }
      if (payload?.payment?.entity) {
        const { order_id, id } = payload?.payment?.entity;

        const order = await TranscationLogs.findOne({
          orderId: order_id,
          status: RAZORPAY_STATUS.CREATED,
        }).lean();

        if (order) {
          const company = await Company.findById(order?.companyId);

          if (company) {
            let mode = "Others";

            // Get payment method from razorpay
            const paymentData = await axios.get(
              `https://${razorpayAppId}:${razorpaySecretKey}@api.razorpay.com/v1/payments/${id}/?expand[]=card`
            );
            if (paymentData?.data) {
              const { method } = paymentData?.data;
              if (method) {
                switch (method) {
                  case "card":
                    if (paymentData.data.card) {
                      const { type } = paymentData.data.card;
                      if (type) {
                        if (type === "debit") {
                          mode = "Debit";
                        } else if (type === "credit") {
                          mode = "Credit";
                        }
                      }
                    }
                    break;
                  case "upi":
                    mode = "UPI";
                    break;
                  case "netbanking":
                    mode = "Netbanking";
                    break;
                  case "wallet":
                    mode = "Wallet";
                    break;
                  case "emi":
                  case "cardless_emi":
                    mode = "EMI";
                    break;
                  default:
                    break;
                }
              }

              if (paymentData?.data?.status === "captured") {
                await TranscationLogs.findOneAndUpdate(
                  {
                    orderId: order_id,
                  },
                  {
                    status: RAZORPAY_STATUS.COMPLETED,
                    mode: mode,
                    returnData: {
                      ...order.returnData,
                      ...payload.payment.entity,
                    },
                    razorpayPaymentId: paymentData?.data?.id,
                  }
                );

                await CommonController.updateOrderToCompany(order);
              } else if (paymentData?.data?.status === "failed") {
                await TranscationLogs.findOneAndUpdate(
                  {
                    orderId: order_id,
                  },
                  {
                    status: RAZORPAY_STATUS.FAILED,
                  }
                );
              }
            }
          }
        }
      }

      res.status(200).send("Success");
    } catch (error) {
      next(error);
    }
  }

  public static async cancelRazorpayPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let razorpay_order_id = req.body.razorpay_order_id as string;

      let order = await TranscationLogs.findOneAndUpdate(
        {
          orderId: razorpay_order_id,
        },
        {
          status: RAZORPAY_STATUS.FAILED,
        }
      ).lean();

      return res.json(
        sendErrorResponse("Payment status updated successfully!")
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getTransactionLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };
      let {
        limit = 10,
        offset = 0,
        sortBy = "createdAt",
        sortType = "desc",
        status = RAZORPAY_STATUS.COMPLETED,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }

      let mongoQuery = { companyId } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }

      let logs = await TranscationLogs.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .populate({
          path: "userId",
          select: {
            name: 1,
          },
        })
        .lean();
      let totalCount = await TranscationLogs.find(mongoQuery).count();

      //  let products1 = await Promise.all(
      //    products.map(async (it) => {
      //      let _id = it?._id;

      //      if (!_id) return { update: false, _id };
      //      delete it?._id;

      //      let update = await Product.updateOne(
      //        { _id: _id },
      //        { status: [1, 2, 3, 4][getRandomIntInclusive(0, 3)] },
      //        {
      //          upsert: true,
      //        }
      //      );

      //      return { update: !!update.ok, _id: _id };
      //    })
      //  );
      return res.json(
        sendSuccessResponse({
          totalCount,
          currentPage: offset / limit + 1,
          logs,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getMessageLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };
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

      let mongoQuery = { companyId } as any;

  

      let logs = await MessageLogs.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .populate({
          path: "userId",
          select: {
            name: 1,
          },
        })
        .lean();
      let totalCount = await TranscationLogs.find(mongoQuery).count();

      //  let products1 = await Promise.all(
      //    products.map(async (it) => {
      //      let _id = it?._id;

      //      if (!_id) return { update: false, _id };
      //      delete it?._id;

      //      let update = await Product.updateOne(
      //        { _id: _id },
      //        { status: [1, 2, 3, 4][getRandomIntInclusive(0, 3)] },
      //        {
      //          upsert: true,
      //        }
      //      );

      //      return { update: !!update.ok, _id: _id };
      //    })
      //  );
      return res.json(
        sendSuccessResponse({
          totalCount,
          currentPage: offset / limit + 1,
          logs,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export default CommonController;
