/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";

import axios, { AxiosRequestConfig } from "axios";
import * as fs from "fs";
import * as XLSX from "xlsx";
import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";
import {
	sendErrorResponse,
	sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { uploadImage } from "../../../services/gcloud/upload";
import Domain from "../../../models/domain";
import { IDomain } from "../../../interfaces/models/domains";
import Profile from "../../../models/profile";
import { IAddress, IUserProfile } from "../../../interfaces/models/profile";
import Cart from "../../../models/cart";
import { ICart } from "../../../interfaces/models/cart";
import Order from "../../../models/orders";
import OrderHistory from "../../../models/orderhistory";
import moment = require("moment");
import { ORDER_STATUS, PAYMENT_METHOD } from "../../../utils/constants";
import { validateOfflineOrder } from "./utils";

const PDFDocument = require("pdf-lib").PDFDocument;
import { createInvoice } from "../orders/pdfkit";
import { sendStatusUpdateEmail } from "../../../utils/notification";

class AdminOrderController {
  public static async getOneOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let id = req.params.id as string;
      if (!id) {
        return res.json(sendErrorResponse("id missing"));
      }

      let orderDetails = await Order.findOne({ _id: new ObjectId(id) })
        .populate("userId")
        .lean();

      let orderhistory = await OrderHistory.find({
        orderId: new ObjectId(id),
      })
        .sort([["createdAt", -1]])

        .limit(5);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails,
            orderhistory,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let {
        limit = 10,
        offset = 0,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortType = "desc",
        status,
        customerId,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        startDate: Date;
        endDate: Date;
        sortType: string;
        status: string;
        customerId: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = { companyId: new ObjectId(companyId) } as any;

      if (customerId) {
        mongoQuery.userId = new ObjectId(customerId);
      }

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      } else {
        mongoQuery["status"] = {
          $nin: [
            ORDER_STATUS.PAYMENT_PROCESSING,
            // ORDER_STATUS.PAYMENT_FAILED
          ],
        };
      }

      if (startDate) {
        if (!mongoQuery["$and"]) {
          mongoQuery["$and"] = [];
        }
        mongoQuery["$and"].push({
          createdAt: {
            $gte: moment(startDate).startOf("day").toDate(),
          },
        });
      }

      if (endDate) {
        if (!mongoQuery["$and"]) {
          mongoQuery["$and"] = [];
        }
        mongoQuery["$and"].push({
          createdAt: {
            $lte: moment(endDate).endOf("day").toDate(),
          },
        });
      }

      let orderDetails = await Order.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .populate("userId")
        .lean();

      let count = await Order.count(mongoQuery);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getOrderHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let id = req.params.id as string;
      if (!id) {
        return res.json(sendErrorResponse("id missing"));
      }

      let {
        limit = 10,
        offset = 0,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortType = "desc",
        status,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        startDate: string;
        endDate: string;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = { orderId: new ObjectId(id) } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }

      if (startDate) {
        mongoQuery["createdAt"] = { $gte: new Date(startDate) };
      }

      if (endDate) {
        mongoQuery["createdAt"] = { $lte: new Date(endDate) };
      }

      let orderHistories = await OrderHistory.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)

        .lean();

      let count = await OrderHistory.count(mongoQuery);

      if (orderHistories) {
        return res.json(
          sendSuccessResponse({
            orderHistories,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async statusUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let orderId = req.params.orderId as string;

      let status = req.body.status as string;

      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!status) {
        return res.json(sendErrorResponse("status needed"));
      }

      let update = await Order.findOneAndUpdate(
        { companyId: companyId, _id: new ObjectId(orderId) },
        { $set: { status } },
        { upsert: true }
      );

      if (update?._id) {
    
        const sendEmail = req.body.sendEmail as boolean;

        if (sendEmail) {
          sendStatusUpdateEmail(companyId, update, status);
        }

        await OrderHistory.insertMany([{ orderId, status }]);
        return res.json(sendSuccessResponse({ message: "updated status" }));
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async createOfflineOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { error } = validateOfflineOrder(req.body);

      if (error) {
        return res
          .status(400)
          .send(sendErrorResponse(error.details[0].message));
      }

      let { companyId } = req.user as { companyId: string };

      const { products, total, mobile, name } = req.body;

      let profileUpdate = {
        mobile,
        companyId,
        verified: true,
      } as any;

      if (name.trim()) {
        profileUpdate.name = name.trim();
      }


      let findInvalidProducts = await AdminOrderController.findInvalidProducts(
        products,
        companyId
      );

      if (findInvalidProducts) {
        return res
          .json(sendErrorResponse("Product quantity is invalid",403));
      }


      const profileData = await Profile.findOneAndUpdate(
        { mobile, companyId },
        profileUpdate,
        { upsert: true, new: true }
      );

        let latestorderId =
          parseInt(
            `${
              (
                await Order.find({ companyId: companyId })
                  .sort({ _id: -1 })
                  .limit(1)
                  .lean()
              )?.[0]?.orderNumber
            }`
          ) || 0;
             let orderNumber = latestorderId + 1;
             const prefix = (await Domain.findOne({ companyId }).lean())?.metaData?.invoice?.prefix || 'INV';
      await Order.create({
        companyId,
        orderId: `${prefix}${orderNumber}`,
        orderNumber,
        products,
        userId: profileData?._id,
        status: ORDER_STATUS.DELIVERED,
        total,
        tax: 0,
        totalAfterTax: total,
        paymentMethod: PAYMENT_METHOD.CASH,
        offline: true,
      });

      let update = await AdminOrderController.updateProducts(
        products,
        companyId,
        "DEC"
      );

      return res.json(sendSuccessResponse(null, "Order created successfully!"));
    } catch (error) {
      next(error);
    }
  }

  public static async updateProducts(
    products: any,
    companyId: string,
    type: string
  ) {
    return await Promise.all(
      products.map(async (it) => {
        let sku = it?.sku;

        if (!sku) {
          if (it?.variantSKU) {
            let update = await Product.updateOne(
              { "variants.sku": it?.variantSKU, companyId, _id: it?.productId },
              {
                $inc: {
                  ["variants.$[elem].quantity"]:
                    type === "INC" ? it.quantity : -it.quantity,
                },
              },
              {
                arrayFilters: [{ "elem.sku": it?.variantSKU }],
                upsert: true,
              }
            );

            return { update: !!update.ok, _id: sku };
          }
        } else {
          let update = await Product.updateOne(
            { sku: sku, companyId, _id: it?.productId },
            { $inc: { quantity: type === "INC" ? it.quantity : -it.quantity } },
            {
              upsert: true,
            }
          );

          console.log(it);

          return { update: !!update.ok, _id: sku };
        }
      })
    );
  }

  public static async getPdfBlob(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      let { id: orderId } = req.params as unknown as {
        id: string;
      };
      let domainDetails = (await Domain.find({ companyId }).lean())[0];

      let orderDetails = await Order.findOne({ _id: orderId })
        .populate("userId")
        .lean();

      if (!domainDetails || !domainDetails.metaData) {
        return res.json(sendErrorResponse("domain details missing"));
      }

      let {
        logo,
        bannerImg,
        logoText = "No Company Name",
        addressLine1 = "Address Line 1",
        addressLine2 = "Address Line 2",
        city = "City",
        pincode = "pincode",
        state = "state",
        mobile = "mobile",
        email = "email",
      } = domainDetails?.metaData;

      //   function repeatElements(arr, n) {
      //     const newArr = [];
      //     for (let i = 0; i < n; i++) {
      //       newArr.push(...arr);
      //     }
      //     return newArr;
      //   }
      //   orderDetails.products = repeatElements(orderDetails?.products, 15);

      let orderAddres = orderDetails?.deliveryAddress;
let userDetails = orderDetails?.userId as any;
      
      let data = {
        invoice_nr: orderDetails?.orderId || orderId,

        logo: logo,
        storeAddress: {
          name: logoText,
          address: addressLine1,
          addressLine2,
          city: city,
          state: state,
          mobile: mobile,
          postal_code: pincode,
        },
        shipping: {
          name: orderAddres?.name || userDetails?.name,
          mobile: userDetails?.mobile || orderAddres,
          address: orderAddres?.addressLine1,
          addressLine2: orderAddres?.addressLine2,
          city: orderAddres?.city,
          state: orderAddres?.state,
          postal_code: orderAddres?.pincode,
        },
        items: orderDetails?.products?.map((it) => ({
          item: `${it?.name} ${it.size?.value ? `| ${it.size?.value}` : ""} ${
            it.color?.alias
              ? `| ${it.color?.alias}`
              : it.color?.value
              ? `| ${it.color?.value}`
              : ""
          }`,

          quantity: it?.quantity,
          amount: (
            parseFloat(it.price?.toString()) * parseFloat(it.quantity)
          )?.toFixed(2),
        })),
        subtotal: orderDetails?.totalAfterTax || 0,
        paid: 0,
        delivery: orderDetails?.delivery || 0,
      } as any;

      let batchSize = 8;
      let buffers = [] as any;

      for (let i = 0; i <= orderDetails?.products?.length; i = i + batchSize) {
        data.items =
          orderDetails?.products?.slice(i, i + batchSize)?.map((it) => ({
            item: `${it?.name} ${it.size?.value ? `| ${it.size?.value}` : ""} ${it.color?.alias ? `| ${it.color?.alias}` : it.color?.value ? `| ${it.color?.value}` : ""}`,

            quantity: it?.quantity,
            amount: (
              parseFloat(it.price?.toString()) * parseFloat(it.quantity)
            )?.toFixed(2),
          })) || 0;

        let buffer = await createInvoice(data);

        buffers.push(buffer);
      }

      const mergedPdf = await PDFDocument.create();
      for (const pdfBytes of buffers) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const buf = await mergedPdf.save(); // Uint8Array

      // await fs.writeFileSync("invoice.pdf", buf);
      if (buf) {
        res.contentType("application/pdf");
        res.send(Buffer.from(buf));
        return;
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  public static async findInvalidProducts(
    products: {
      name: string;
      sku: string;
      quantity: number;
      thumbnail: string;
      productId: import("mongoose").Types.ObjectId;
      price: number;
      variantSKU: string;
      size: { label: string; value: string };
      color: { label: string; value: string };
      valid: boolean;
    }[],
    companyId: string
  ) {
    let productsPresent = await Product.find({
      _id: { $in: products?.map((it) => it.productId) || [] },
      companyId,
    }).lean();

    let findInvalidProducts = products.find((it) => {
      let productPresent = productsPresent.find(
        (pt) => pt._id.toString() === it.productId.toString()
      );

      if (!it.sku) {
        if (it.variantSKU) {
          let quantity = productPresent.variants?.find(
            (vt) => vt.sku === it.variantSKU
          )?.quantity;
          let outOfStock = productPresent.variants?.find(
            (vt) => vt.sku === it.variantSKU
          )?.outOfStock;

          if (!quantity || quantity < it.quantity || outOfStock) {
            return true;
          }
        }
      } else {
        let quantity = productPresent?.quantity;

        if (!quantity || quantity < it.quantity) {
          return true;
        }
      }
    });
    return findInvalidProducts;
  }
}
export default AdminOrderController;


