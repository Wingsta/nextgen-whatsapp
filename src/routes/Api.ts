/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from "express";

import Locals from "../providers/Locals";


import { getScreenShot } from "../controllers/Api/common/pupeeter";

const router = Router();

router.get(
  "/screenshot",
  getScreenShot
);

router.get("/login", getScreenShot);

// router.post(
// 	"/upload",
// 	passport.authenticate("jwt", { session: false }),
// 	CommonController.upload
// );
export default router;
