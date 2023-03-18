import AccountUser from "../models/accountuser";
import Profile from "../models/profile";
import Domain from "../models/domain";
import { Capitalize, currencyFormatter, ORDER_STATUS, PAYMENT_METHOD } from "./constants";
import { sendEmail } from "./mailer";

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const APP_LINK = process.env.APP_LINK;

export const sendNewOrderEmail = async (companyId, orderDetails, sendToAdmin = true) => {
    try {

        const user = await AccountUser.findOne({ companyId }).select({
            name: 1,
            email: 1
        }).lean();
        
        if (
            orderDetails?.paymentMethod === PAYMENT_METHOD.CASH
            ||
            orderDetails?.status === ORDER_STATUS.CONFIRMED
        ) {
            sendEmail('orderAdmin', user?.email, {
                name: Capitalize(user?.name),
                orderId: orderDetails?.orderId,
                total: currencyFormatter(orderDetails?.totalAfterTax),
                orderLink: `${APP_LINK}/orders/${orderDetails?._id}`
            });
        }

        if (
            orderDetails?.paymentMethod === PAYMENT_METHOD.CASH
            ||
            (
                orderDetails?.paymentMethod === PAYMENT_METHOD.RAZORPAY
                &&
                orderDetails?.status === ORDER_STATUS.CONFIRMED
            )
        ) {
            const profileUser = await Profile.findById(orderDetails?.userId).select({
                name: 1,
                email: 1
            }).lean();

            console.log(profileUser);
    
            if (profileUser?.email) {
    
                const companyDetails = await Domain.findOne({ companyId }).lean();
    
                sendEmail(
                    orderDetails?.paymentMethod === PAYMENT_METHOD.CASH ? 'orderCustomer' : 'orderCustomerPG', 
                    profileUser?.email, {
                        iLogo: companyDetails?.metaData?.logo|| undefined,
                        name: Capitalize(profileUser?.name) || "User",
                        orderId: orderDetails?.orderId,
                        total: currencyFormatter(orderDetails?.totalAfterTax),
                        email: companyDetails?.metaData?.email || user?.email,
                        storeName: companyDetails?.metaData?.logoText || companyDetails?.name,
                        orderLink: `${APP_LINK}/${companyDetails?.name}/orders`
                    }
                );
            }
        }

    } catch(e) {
        console.log(e);
    }
}

export const sendStatusUpdateEmail = async (companyId, orderDetails, status) => {
    try {

        const user = await AccountUser.findOne({ companyId }).select({
            name: 1,
            email: 1
        }).lean();

        const profileUser = await Profile.findById(orderDetails?.userId).select({
            name: 1,
            email: 1
        }).lean();

        if (profileUser?.email) {

            const companyDetails = await Domain.findOne({ companyId }).lean();

            sendEmail(
                "orderUpdate", 
                profileUser?.email, 
                {
                    iLogo: companyDetails?.metaData?.logo|| undefined,
                    name: Capitalize(profileUser?.name) || "User",
                    orderId: orderDetails?.orderId,
                    total: currencyFormatter(orderDetails?.totalAfterTax),
                    email: companyDetails?.metaData?.email || user?.email,
                    storeName: companyDetails?.metaData?.logoText || companyDetails?.name,
                    orderLink: `${APP_LINK}/${companyDetails?.name}/orders`,
                    status: Capitalize(status.toLowerCase())
                }
            );
        }

    } catch(e) {
        console.log(e);
    }
}