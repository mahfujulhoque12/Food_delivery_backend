import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createAndEditShop,
  getCurrentShop,
} from "../controllers/shop.controller.js";
import { upload } from "../middleware/multer.js";

const shopRouter = express.Router();

shopRouter.post(
  "/create-edit",
  isAuth,
  upload.single("image"),
  createAndEditShop,
);
shopRouter.get("/get-shop", isAuth, getCurrentShop);

export default shopRouter;
