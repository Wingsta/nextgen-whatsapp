import { parentPort } from "worker_threads";
import { Types } from "mongoose";
import * as mongoose from "mongoose";
import * as json2csv from "json2csv";
import Messages from "../models/message";
import MessageLogs from "../models/messagelog";

import * as fs from "fs";
import axios from "axios";
import User from "../models/user";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
const path = require("path");
const mime = require("mime-types");

const COMPANY_NAME = "nextgen";

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "next-gen" }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

async function getFileObjectFromS3Url(s3Url) {
  try {
    if (!s3Url) return null;

    const response = await axios.get(s3Url, { responseType: "arraybuffer" });
    const urlPath = new URL(s3Url).pathname;
    const filename = path.basename(urlPath);
    const mimetype = mime.lookup(filename);
    const fileObject = {
      buffer: response.data.toString("base64"),
      size: response.data.length,
      mimetype: mimetype,
      filename: filename,
    };
    console.log(Buffer.from(response.data));
    return fileObject;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function getRandomNumber() {
  return Math.floor(Math.floor(Math.random() * 5) + 8);
}

async function updateQrCode(qrcode, name) {
  const user = User.findOneAndUpdate(
    { name },
    { $set: { qrcode } },
    { upsert: true }
  ).lean();
  return await user;
}
async function mainModule() {
  try {
    async function createUser(name) {
      const user = new User({ name });
      await user.save();
    }

    async function findUser(name) {
      const user = User.findOne({ name }).lean();
      return await user;
    }

    async function lockMessage(id) {
      const user = await Messages.findOneAndUpdate(
        { _id: id },
        { $set: { lock: true } },
        { upsert: true }
      ).lean();

      return user;
    }

    async function processStatus(id, status) {
      const user = await Messages.findOneAndUpdate(
        { _id: id },
        { $set: { processed: !!status } },
        { upsert: true }
      ).lean();

      return user;
    }

    async function unlockMessage(id) {
      const user = await Messages.findOneAndUpdate(
        { _id: id },
        { $unset: { lock: 1 } },
        { upsert: true }
      ).lean();

      console.log(user);
      return user;
    }

    async function lockMessages() {
      let messagesData = await Messages.find({
        processed: { $ne: true },
        lock: true,
      })
        .limit(2)
        .lean();

      if (messagesData && messagesData?.length === 1) {
        let messageId = messagesData?.[0]._id;
        let messagedataObject = messagesData?.[0];
        let CONTACTS = messagesData?.[0]?.contacts || [];
       
     
        let remainingContacts = CONTACTS.filter(
          (it) => !it.status
        );

        let fileObject = await getFileObjectFromS3Url(
          (messagedataObject?.media as any)?.urls?.[0]
        );

        let timeOut = getRandomNumber() * 1000;

        for (let i in remainingContacts) {
          //
          let contactRe = remainingContacts[i].contact;

          let attachment = null;

          if (fileObject) {
            attachment = new MessageMedia(
              fileObject.mimetype,
              fileObject.buffer,
              fileObject.filename,
              fileObject.size
            );
            console.log(fileObject.filename, fileObject.mimetype);
          }

          let k = await client.getNumberId(contactRe);
          if (k._serialized) {
            if (attachment) {
              await client.sendMessage(
                k._serialized,
                messagedataObject?.message as string,
                {
                  media: attachment,
                }
              );
            } else
              await client.sendMessage(
                k._serialized,
                messagedataObject?.message as string
              );
            //  console.log(s);
          }

          console.log(i, timeOut);
          CONTACTS = CONTACTS.map((it) => {
            if (it.contact === contactRe) {
              it.status = true;
            }

            return it
          });

          await asyncTimeout(timeOut);
        }

        await processStatus(messageId, true);
       await Messages.findOneAndUpdate(
         { _id: messageId },
         { $set: { contacts: CONTACTS } },
         { upsert: true }
       );

        await unlockMessage(messageId);

        await asyncTimeout(10000);
        checkMessages();
      } else {
        console.log("something went wrong");
      }
    }

    async function checkMessages() {
      console.log("+++++++++ CHECKING FOR MESSAGES ++++++++");
      let isUnProcessed = await Messages.findOne({
        processed: { $ne: true },
      }).lean();
      // console.log(await Messages.findOne({}).lean(), isUnProcessed);
      if (!isUnProcessed || !isUnProcessed?._id) {
        console.log("+++++++++ NO MESSAGES WAITING FOR 10 SECONDS ++++++++");
        await asyncTimeout(10000);

        checkMessages();
        return;
      }

      let isLocked = await Messages.findOne({ lock: true }).lean();

      if (!isLocked) {
        await lockMessage(isUnProcessed?._id);
      }

      lockMessages();

      return;
    }

    await asyncTimeout(1000);
    let k = await findUser(COMPANY_NAME);
    if (!k) {
      await createUser(COMPANY_NAME);
    }
    k = await findUser(COMPANY_NAME);

    await checkMessages();

    // parentPort.postMessage('Hello from the worker thread!');
  } catch (error) {
    console.log(error);
  }
}

function init() {
  const dsn = process.env.MONGOOSE_URL;
  const options = { useNewUrlParser: true, useUnifiedTopology: true };
  mongoose.connect(dsn, options, (error) => {
    // handle the error case
    if (error) {
      console.log(error, "error");
      throw error;
    } else {
      console.log("connected to mongo server at: " + dsn);
    }
  });
}

function asyncTimeout(delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, delay);
  });
}

client.on("qr", (qr) => {
  // Generate and scan this code with your phone
  console.log(qr);
  if (User) updateQrCode(qr, COMPANY_NAME);
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", async () => {
  console.log("READY");

  if (User) {
    await updateQrCode("", COMPANY_NAME);
    mainModule();
  }

  // let k = await client.getNumberId("8056063139");
  // client.sendMessage(k._serialized, "hello")
  // console.log(k);
});
console.log("stating client");

const start = () => {
  client.initialize();
};

init();
// client.resetState()
export default start;

// while(1){
//     await asyncTimeout(1000)
//     AccountUs
//     parentPort.postMessage('Hello from the worker thread!');
// }
