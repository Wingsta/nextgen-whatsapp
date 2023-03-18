import Category from '../../../models/category';
import Product from '../../../models/products';
import Delivery from '../../../models/delivery';
import { deliveryFeeConstants, deliveryFlatFeeConstants, deliveryZoneConstants } from '../../../utils/constants';

export const updateCategoryProduct = async (categoryId) => {
    try {
        let productCount = await Product.countDocuments({
            categoryId
        })

        await Category.findByIdAndUpdate(categoryId, { productCount })
    } catch (error) {
        
    }
}

export const calculateDeliveryCharge = async (companyId, orderAmount) => {
    try {
        let data = await Delivery.findOne({ companyId });

        let deliveryCost = 0, pincode = [], selfPickup = false;

        if (!data) {
            return {
                enableSelfPickup: selfPickup,
                pincode,
                deliveryCost
            };
        }

        if (data?.deliveryZone === deliveryZoneConstants.ADVANCED) {
            pincode = data?.pincode
        }
        
        if (data?.deliveryFee === deliveryFeeConstants.FLAT) {

            if (data?.flatFeeType === deliveryFlatFeeConstants.AMOUNT) {
                deliveryCost = data?.flatFeeAmount || 0;
            }

            if (data?.flatFeeType === deliveryFlatFeeConstants.PERCENTAGE) {
                if (data?.flatFeeAmount) {
                    deliveryCost = ((orderAmount * data?.flatFeeAmount) / 100);
                }
            }
        }

        if (data?.deliveryFee === deliveryFeeConstants.CUSTOM) {
            let i;

            for (i=0;i<data?.customAmount.length;i++) {
                if (i === data?.customAmount.length-1) {
                    deliveryCost = data?.customAmount[i]?.deliveryCharge;
                    break;
                }

                if (orderAmount <= data?.customAmount[i].max && orderAmount >= data?.customAmount[i].min) {
                    deliveryCost = data?.customAmount[i]?.deliveryCharge;
                    break;
                }
            }
        }

        selfPickup = data?.selfPickup;

        return {
            enableSelfPickup: selfPickup,
            pincode,
            deliveryCost
        };
    } catch (error) {
        return {
            enableSelfPickup: false,
            pincode: [],
            deliveryCost: 0
        };
    }
}