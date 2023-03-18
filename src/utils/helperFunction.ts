import Configuration from "../models/configuration";
import { configurationTypes, notificationConfigConstant } from "./constants";

export const checkNotification = async (companyId: string, key: string, returnAll: boolean = false):Promise<any> => {
    try {
        let notificationConfig = {} as any;
        
        notificationConfig = await Configuration.findOne({
            companyId,
            type: configurationTypes.NOTIFICATION
        });

        notificationConfig = notificationConfig?.data || {};

        notificationConfig = {
            ...notificationConfigConstant,
            ...notificationConfig
        }

        if (returnAll) {
            return notificationConfig;
        }

        return notificationConfig[key] ? true : false;      
    } catch (e) {
        if (returnAll) {
            return notificationConfigConstant;
        }
        return false;
    }
}