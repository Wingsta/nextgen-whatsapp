import { Request, Response, NextFunction } from "express";
import puppeteer from "puppeteer";
const { Client, LocalAuth } = require("whatsapp-web.js");

export const getScreenShot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const client = new Client({ authStrategy: new LocalAuth() });
    client.on("qr", (qr) => {
      // Generate and scan this code with your phone
      console.log("QR RECEIVED", qr);
    });

    client.on("authenticated", () => {
      console.log("AUTHENTICATED");
    });

    client.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessful
      console.error("AUTHENTICATION FAILURE", msg);
    });

    client.on("ready",async () => {
      console.log("READY");

        let k = await client.getNumberId("8056063139");
client.sendMessage(k._serialized,"hello")
        console.log(k);
    });

    client.initialize();

  

//    const browser = await puppeteer.launch({
//      puppeteer: {
//        headless: true,
//        defaultViewport: null,
//      },
//      authTimeoutMs: 0,
//      qrMaxRetries: 0,
//      takeoverOnConflict: false,
//      takeoverTimeoutMs: 0,
//      userAgent:
//        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
//      ffmpegPath: "ffmpeg",
//      bypassCSP: false,
//    });

//    const page = await browser.newPage();
//    await page.setUserAgent(
//      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
//    );

//    await page.setViewport({ width: 1280, height: 720 });

//    const website_url = "https://web.whatsapp.com/";

//    // Open URL in current page
//    await page.goto(website_url, {
//      waitUntil: "load",
//      timeout: 0,
//      referer: "https://whatsapp.com/",
//    });
//     // await page.setDefaultTimeout(0);
// // 
//     await page.waitForSelector("div[data-ref] canvas");

//     // const element = await page.$('div[data-testid="qrcode"]');

//     // console.log(element)
//     let im = await page.screenshot({
//       path: `./images/post_image.jpg`,
//     });

//     console.log(im)
     res.json({complete : "completed"})
  } catch (error) {
    console.log(error)
  }
};
