import axios from "axios";
import { logMessage } from "./logMessage";


export async function sendWhatsAppMessage(phoneNumber : string, message : string, companyId : string, userId : string) {
  const url = "https://api.gupshup.io/sm/api/v1/msg";
  const apiKey = "uy12ftzglolkkf6birwyahzfvv9h7ffi";
  
  const channel = "917834811114";

  const config = {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: apiKey,
    },
  };

  const data = {
    channel: "whatsapp",
    source: channel,
    destination: "918667300544",
    message: JSON.stringify({
      type: "text",
      text: "Download your {{1}} ticket from the link given below. | [Visit Website,https://www.gupshup.io/developer/{{1}}]",
    }),
    "src.name": "sociallink",
  } as any;

  const obj = data;


  const encodedString = Object.entries(obj)
    .map(
      ([key, val]) => {
        console.log(key,val)
        return `${encodeURIComponent(key)}=${encodeURIComponent(val as any)}`
      }
    )
    .join("&");

  console.log(encodedString);

  try {
    const response = await axios.post(url, encodedString, config);

    console.log(response);
    await logMessage(
      "WHATSAPP",
      message,
      phoneNumber,
      "0.25",
      "0.1",
      companyId,
      userId
    );
    console.log("Message sent successfully");
  } catch (error) {
    console.error(error);
  }
}