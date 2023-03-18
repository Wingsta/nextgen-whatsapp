export const ORDER_STATUS = {
    PROCESSING: "PROCESSING",
    PAYMENT_PROCESSING: "PAYMENT_PROCESSING",
    CONFIRMED: "CONFIRMED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    RETURNED: "RETURNED",
    DELIVERY_CANCELLED: "DELIVERY_CANCELLED"
}

export const RAZORPAY_STATUS = {
  CREATED: "CREATED",
  COMPLETED : "COMPLETED",
  FAILED : "FAILED",
  CANCELLED : "CANCELLED",
  PROCESSING : "PROCESSING"
};

export const RAZORPAY_TRANSCATION_STATUS = {
    IN : "IN",
    OUT :"OUT",
    REFUND : "REFUND"
}

export const RAZORPAY_TRANSCATION_GATEWAY = {
    RAZORPAY : "RAZORPAY"
}

export const PER_UNIT_CREDIT_COST = {
    SMS : 0.25,
    WHATSAPP : 0.7,
    GST : 0.18
}

export const CREDIT_TYPES = {
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
};

export const PAYMENT_METHOD = {
    CARD: "CARD",
    CASH: "CASH",
    UPI: "UPI",
    NETBANKING: "NET-BANKING",
    FREE: "FREE",
    RAZORPAY: "RAZORPAY"
}

export const roundOff = (num:number, includeDecimal?:Boolean) => {
    let temp = Number(num);
    return includeDecimal
        ? Math.round((temp + Number.EPSILON) * 100) / 100
        : Math.round(temp);
};


const Razorpay = require('razorpay');
const uuid = require('uuid');

export const createRazorpayOrder = (key_id: string, key_secret: string, amount:number,notes?: any):any => {

    const instance = new Razorpay({
        key_id,
        key_secret
    });

    const options = {
      amount: roundOff(amount, true) * 100, // Razorpay treats input as paise, so we make it rupees by multiplying by 100
      currency: "INR",
      receipt: uuid.v4(),
      payment_capture: 1,
      notes: notes || []
    };

    console.log(options);

    return new Promise((resolve, reject) => { 
        instance.orders.create(options, async (error, order) => {
            if (error) {
                let message = 'Something failed, please try again.';
                if (error.error && error.error.description) {
                    message = error.error.description;
                }
                reject(new Error(message));
            }
    
            resolve(order)
        });
    })
}

export const deliveryZoneConstants = {
    NO_LIMITATION: "NO_LIMITATION",
    ADVANCED: "ADVANCED"
}

export const deliveryFeeConstants = {
    "FREE": "FREE",
    "FLAT": "FLAT",
    "CUSTOM": "CUSTOM"
}

export const deliveryFlatFeeConstants = {
    "AMOUNT": "AMOUNT",
    "PERCENTAGE": "PERCENTAGE"
}

export const currencyFormatter = (input, needSymbol = true) => {
    let options = needSymbol ? {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    } : {
        minimumFractionDigits: 0
    }

    if (input) {
        return (input).toLocaleString('en-IN', options)
    } else {
        return (0).toLocaleString('en-IN', options)
    }
};

export const Capitalize = text => {
    try {
        return text ? text[0].toUpperCase() + text.slice(1) : "";
    } catch (e) {
        return "";
    }
};

export const configurationTypes = {
    TERMS_AND_CONDITIONS: "terms and conditions",
    PRIVACY_POLICY: "privacy policy",
    NOTIFICATION: "notification"
}

export const replaceSpecialChars = (text: string, sendEmptyString?: boolean) => {
    return text
        ? String(text).trim().replace(/[&\/\\#, +()$~%.'":*?<>{}^\[\]\|]/g, '\\$&')
        : (sendEmptyString ? '' : text);
};

export const messageType = {
    MESSAGE: "message",
    ENQUIRY: "enquiry"
}

export const messageTypeConstant = Object.values(messageType);

export const notificationConfigConstant = {
    orderCreationSMS: true,
    orderCreationWhatsapp: false,
    orderUpdateSMS: true,
    orderUpdateWhatsapp: false,
}