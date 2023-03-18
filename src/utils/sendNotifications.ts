import Company from "../models/company";
import { checkNotification } from "./helperFunction";
import { sendWhatsAppMessage } from "./whatsapp";


export async function sendMessage(companyId : string,userId : string, key : string, phoneNumber : string, data : Record<string,any>)  {
  const hasPermission = await checkNotification(companyId, key);

//   if (!hasPermission) {
//     console.log("Company does not have permission to send message");
//     return;
//   }

  switch (key) {
    case "orderCreationWhatsapp":
      // Call API to send message using key1
      await sendWhatsAppMessage(phoneNumber, "",companyId,userId);
      await incrementWhatsapp(companyId);
      break;
    case "key2":
      // Call API to send message using key2
      break;
    case "orderUpdateWhatsapp":
      await sendWhatsAppMessage(phoneNumber, "", companyId, userId);
      await incrementWhatsapp(companyId)
      break;
    default:
      console.log("Invalid key");
  }

//   await incrementSMS(companyId);
}

async function incrementSMS(companyId: string) {
    await Company.updateOne(
        { _id: companyId },
        { $inc: { "sms.totalUsed": 0.25 } },
        {
            upsert: true,
        }
    );
}

async function incrementWhatsapp(companyId: string) {
  await Company.updateOne(
    { _id: companyId },
    { $inc: { "whatsapp.totalUsed": 0.25 } },
    {
      upsert: true,
    }
  );
}
