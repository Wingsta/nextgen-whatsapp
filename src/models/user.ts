import mongoose from "../providers/Database";

let User = mongoose.model(
  "Users",
  new mongoose.Schema({ name: String, qrcode: String })
);

export default User;
