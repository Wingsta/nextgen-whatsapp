/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from "express";

import Locals from "../providers/Locals";


import { getScreenShot } from "../controllers/Api/common/pupeeter";
import CommonController from "../controllers/Api/common";
import * as passport from "passport";

const router = Router();

router.post(
  "/message",
  CommonController.postMessage
);

router.get("/message/status/:id", CommonController.downloadJSON);

router.get("/message", CommonController.getMessage);

router.get("/checkQRCode", CommonController.getQrCode);

router.post(
  "/upload",
  // passport.authenticate("jwt", { session: false }),
  CommonController.upload
);

router.post("/login", CommonController.login);


router.get(
  "/screenshot",

  getScreenShot
);

// router.post(
// 	"/upload",
// 	passport.authenticate("jwt", { session: false }),
// 	CommonController.upload
// );
export default router;
