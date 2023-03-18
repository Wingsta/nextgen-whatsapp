import MessageLogs from "../models/messagelogs";

export async function logMessage(
  type: "SMS" | "WHATSAPP",
  message: string,
  phoneNumber: string,
  creditsUsed: string,
  actualSpent: string,
  companyId : string,
  userId : string,
) {
  const messageLog = new MessageLogs({
    type,
    message,
    phoneNumber,
    creditsUsed,
    actualSpent,
  });


  await messageLog.save();
}
