const util = require("util");
const gc = require("./index");
const bucket = gc.bucket("insta-pilot-beta.appspot.com"); // should be your bucket name
import * as sharp from "sharp";
/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

export async function compressImages() {
  // Replace with your own project ID and key file path

  let bucketName = "insta-pilot-beta.appspot.com";
  let [files] = await bucket.getFiles({
    prefix: `63eb60993ccb570011bd67fd/`,
  });

  console.log(files.length);
  files = files.filter((it) => it.metadata.contentType.startsWith("image/webp"));
  console.log(files.length);
  for (const file of files) {
    // continue
    try {
      const metadata = await file.metadata;
      console.log(metadata?.contentType, metadata?.size);
      if (
        metadata.contentType.startsWith("image/webp") &&
        parseInt(metadata?.size) > 317776
      ) {
        try {
          const stream = file.createReadStream();
          const resizedStream = stream.pipe(
            sharp().resize(600, 600, {
              fit: "contain",

              background: { r: 255, g: 255, b: 255, alpha: 0.0 },
            })
          );
          const newFile = gc.bucket(bucketName).file(`${metadata?.name}`);
          const writeStream = newFile.createWriteStream();
          resizedStream.pipe(writeStream);

          await new Promise((resolve: any, reject) => {
            writeStream.on("error", reject);
            writeStream.on("finish", async () => {
              let k = await newFile.makePublic();
              resolve();
            });
          });

          console.log(`${file.name} compressed and saved as ${newFile.name}`);
        } catch (errrr) {
          console.log(`${file.name} is not an image errrrr`);
        }
      } else {
        console.log(`${file.name} is not an image`);
      }
    } catch (err) {
      console.error(`Error compressing ${file.name}: ${err}`);
    }
  }
}

export const uploadImage = (file, company: string) =>
  new Promise((resolve, reject) => {
    const { originalname, buffer } = file;

    const blob = bucket.file(`${company}/${originalname}`.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream
      .on("finish", async () => {
        let k = await blob.makePublic();
        console.log(k, "hellpp");
        console.log(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      })
      .on("error", (error) => {
        console.log(error);
        reject(`Unable to upload image, something went wrong`);
      })
      .end(buffer);
  });

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

export const uploadImageForSocialLink = (file, company: string) =>
  new Promise((resolve, reject) => {
    const { originalname, buffer } = file;

    const blob = bucket.file(`sociallink/${originalname}`.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream
      .on("finish", async () => {
        let k = await blob.makePublic();
        console.log(k, "hellpp");
        console.log(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      })
      .on("error", (error) => {
        console.log(error);
        reject(`Unable to upload image, something went wrong`);
      })
      .end(buffer);
  });
