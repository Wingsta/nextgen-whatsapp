import { NextFunction, Request, Response } from "express";
import { ObjectID, ObjectId } from "mongodb";
import Company from "../../../models/company";
import { IProducts } from "../../../interfaces/models/products";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { IAddress } from "../../../interfaces/models/profile";
import Cart from "../../../models/cart";
import Order from "../../../models/orders";
import moment = require("moment");
import OrderHistory from "../../../models/orderhistory";
import {
  createRazorpayOrder,
  ORDER_STATUS,
  PAYMENT_METHOD,
} from "../../../utils/constants";
import * as fs from "fs";

import { calculateDeliveryCharge } from "../common/common";
const crypto = require("crypto");
const axios = require("axios");

import Domain from "../../../models/domain";
import { createInvoice } from "./pdfkit";
import Product from "../../../models/products";
import AdminOrderController from "../admin-orders";
import { sendNewOrderEmail } from "../../../utils/notification";
import { sendMessage } from "../../../utils/sendNotifications";
const PDFDocument = require("pdf-lib").PDFDocument;

class ProfileController {
  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
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
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        startDate: Date;
        endDate: Date;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = {
        companyId: new ObjectId(companyId),
        userId: new ObjectId(id),
      } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
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
        // .populate("userId")
        .lean();

      let count = await Order.count(mongoQuery);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails: orderDetails,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getOrdersCount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let orderDetails = await Order.count({
        userId: new ObjectId(id),
        companyId: new ObjectId(companyId),
      });

      if (orderDetails !== undefined) {
        return res.json(
          sendSuccessResponse({
            count: orderDetails,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getPdfBlob(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }
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
        items: orderDetails?.products?.map((it) => {
          return {
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
          };
        }),
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

  public static async postOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let cartId = req.body.cartId as string[];
      let deliveryAddress = req.body.deliveryAddress as IAddress;
      let paymentMethod = req.body.paymentMethod;
      let preview = req.body.preview;
      let selfPickup = req.body.selfPickup;

      let { id, companyId } = req.user as {
        companyId: string;
        id: string;
        mobile; string
      };

      
      
      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!preview && !deliveryAddress) {
        return res.json(sendErrorResponse("deliveryAddress needed"));
      }

      if (!preview && !paymentMethod) {
        return res.json(sendErrorResponse("deliveryAddress needed"));
      }

      let query = {} as any;
      if (cartId?.length) {
        query = { _id: { $in: cartId.map((it) => new ObjectId(it)) } };
      }

      
      let cartIdFound = [] as string[];
      let products = (
        await Cart.find({
          ...query,
          userId: new ObjectId(id),
        })
          .populate("productId")
          .lean()
      )?.map((it) => {
        let product = it?.productId as any as IProducts;
        cartIdFound.push(it._id);

        if (it?.variantSKU) {
          let valid = true;

          let index = product?.variants?.findIndex(
            (z) => z.sku === it?.variantSKU
          );

          if (index === -1) {
            valid = false;
          }

          return {
            name: product?.name,
            sku: product?.sku,
            quantity: it?.quantity || 1,
            thumbnail: product?.thumbnail,
            productId: product?._id,
            price: product?.variants[index]?.price,
            variantSKU: it?.variantSKU,
            size: it?.size,
            color: it?.color,
            valid,
          };
        }

        return {
          name: product?.name,
          sku: product?.sku,
          quantity: it?.quantity || 1,
          thumbnail: product?.thumbnail,
          productId: product?._id,
          price: product?.price,
          variantSKU: it?.variantSKU,
          size: it?.size,
          color: it?.color,
          valid: product ? true : false,
        };
      });

      products = products.filter((x) => x.valid);

      const reducedProduct = products.reduce((a, b) => {
        a = a + (b?.quantity || 1) * (b?.price || 0);

        return a;
      }, 0);
      let total = products?.length ? reducedProduct : 0;
      let tax = 0;

      if (!products) {
        return res.json(sendErrorResponse("products not found"));
      }

      const orderAmount = (total + tax).toFixed(2);

      let { enableSelfPickup, pincode, deliveryCost } =
        await calculateDeliveryCharge(companyId, orderAmount);

      if (selfPickup) {
        pincode = [];
        deliveryCost = 0;
      }

      let totalAfterTax = (total + tax + deliveryCost).toFixed(2);

      if (preview)
        return res.json(
          sendSuccessResponse({
            userId: id,
            products: products,
            total,
            tax,
            delivery: deliveryCost,
            totalAfterTax,
            deliveryAddress,
            paymentMethod,
            pincode,
            enableSelfPickup,
          })
        );

      let findInvalidProducts = await AdminOrderController.findInvalidProducts(products, companyId);

      if (findInvalidProducts) {
        return res
          .json(sendErrorResponse("Product quantity is invalid", 403));
      }


      

      let status = ORDER_STATUS.PROCESSING;

      let razorpayData = {};

      if (paymentMethod === PAYMENT_METHOD.RAZORPAY) {
        const company = await Company.findById(companyId);

        if (!company) {
          throw new Error("Store details not found!");
        }

        const { razorpayAppId, razorpaySecretKey } = company;

        if (!(razorpayAppId && razorpaySecretKey)) {
          throw new Error("Razorpay creds not found!");
        }

        const orderData = await createRazorpayOrder(
          razorpayAppId,
          razorpaySecretKey,
          +totalAfterTax
        );

        razorpayData = {
          razorpayOrderId: orderData?.id,
          returnData: orderData,
        };

        status = ORDER_STATUS.PAYMENT_PROCESSING;
      }

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
     const prefix =
       (await Domain.findOne({ companyId }).lean())?.metaData?.invoice
         ?.prefix || "INV";
      let order = await new Order({
        userId: new ObjectId(id),
        companyId: companyId,
        orderId: `${prefix}${orderNumber}`,
        orderNumber,
        products: products,
        status,
        total,
        tax,
        delivery: deliveryCost,
        totalAfterTax,
        deliveryAddress,
        paymentMethod,
        selfPickup,
        ...razorpayData,
      }).save();

      if (order?._id) {
        await Cart.deleteMany({
          _id: { $in: cartIdFound.map((it) => new ObjectID(it)) },
        });

        let update = await AdminOrderController.updateProducts(products,companyId, 'DEC');

        // sendNewOrderEmail(companyId, order);
        sendMessage(companyId, id,"orderCreationWhatsapp", "mobile", {
          orderId: `${prefix}${orderNumber}`,
          totalAfterTax,
        });

        return res.json(
          sendSuccessResponse({
            ...order.toJSON(),
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async updateRazorpayPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let razorpay_order_id = req.body.razorpay_order_id as string;

      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!razorpay_order_id) {
        throw new Error("Razorpay order id is required!");
      }

      const company = await Company.findById(companyId);

      if (!company) {
        throw new Error("company details not found!");
      }

      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).lean();

      if (!order) {
        throw new Error("order details not found!");
      }

      if (order?.status === ORDER_STATUS.CONFIRMED) {
        return res.json(
          sendSuccessResponse(null, "Payment status updated successfully!")
        );
      }

      const { razorpayAppId, razorpaySecretKey } = company;

      const generatedSignature = crypto
        .createHmac("SHA256", razorpaySecretKey)
        .update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== req.body.razorpay_signature) {
        await Order.findOneAndUpdate(
          {
            razorpayOrderId: req.body.razorpay_order_id,
          },
          {
            status: ORDER_STATUS.PAYMENT_FAILED,
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
          await Order.findOneAndUpdate(
            {
              razorpayOrderId: razorpay_order_id,
            },
            {
              status: ORDER_STATUS.CONFIRMED,
              mode: mode,
              returnData: { ...order.returnData, ...req.body },
              razorpayPaymentId: req.body.razorpay_payment_id,
            }
          );

          sendNewOrderEmail(companyId, { ...order, status: ORDER_STATUS.CONFIRMED }, false);
        } else if (paymentData?.data?.status === "failed") {
          await Order.findOneAndUpdate(
            {
              razorpayOrderId: razorpay_order_id,
            },
            {
              status: ORDER_STATUS.PAYMENT_FAILED,
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

  public static async updateRazorpayPaymentWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { payload } = req.body;

      if (payload?.payment?.entity) {
        const { order_id, id } = payload?.payment?.entity;

        const order = await Order.findOne({
          razorpayOrderId: order_id,
          status: ORDER_STATUS.PAYMENT_PROCESSING,
        }).lean();

        if (order) {
          const company = await Company.findById(order?.companyId);

          if (company && company?.razorpayAppId && company?.razorpaySecretKey) {
            const { razorpayAppId, razorpaySecretKey } = company;

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
                await Order.findOneAndUpdate(
                  {
                    razorpayOrderId: order_id,
                  },
                  {
                    status: ORDER_STATUS.CONFIRMED,
                    mode: mode,
                    returnData: {
                      ...order.returnData,
                      ...payload.payment.entity,
                    },
                    razorpayPaymentId: paymentData?.data?.id,
                  }
                );

                sendNewOrderEmail(order?.companyId, { ...order, status: ORDER_STATUS.CONFIRMED }, false);
              } else if (paymentData?.data?.status === "failed") {
                await Order.findOneAndUpdate(
                  {
                    razorpayOrderId: order_id,
                  },
                  {
                    status: ORDER_STATUS.PAYMENT_FAILED,
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

     let order =  await Order.findOneAndUpdate(
        {
          razorpayOrderId: razorpay_order_id,
        },
        {
          status: ORDER_STATUS.PAYMENT_FAILED,
        }
      ).lean();

      if(order.products){
        let update = await AdminOrderController.updateProducts(
          order.products,
          order.companyId.toString() as string,
          "DEC"
        );
      }


      return res.json(
        sendErrorResponse("Payment status updated successfully!")
      );
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

      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!status) {
        return res.json(sendErrorResponse("status needed"));
      }

      let update = await Order.updateOne(
        { companyId: companyId, _id: new ObjectId(orderId) },
        { $set: { status } },
        { upsert: true }
      );

      if (update?.ok) {
        await OrderHistory.insertMany([{ orderId: id, status }]);
        return res.json(sendSuccessResponse({ message: "updated status" }));
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;

