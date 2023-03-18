const Cloud = require("@google-cloud/storage");
const path = require("path");
const serviceKey = path.join(__dirname, "../../../gcloud-key.json");

const { Storage : GCPStorage } = Cloud;
const storage = new GCPStorage({
  keyFilename: serviceKey,
  projectId: "insta-pilot-beta",
});

module.exports = storage;
