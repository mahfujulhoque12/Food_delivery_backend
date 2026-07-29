import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  addItem,
  deleteItem,
  editItem,
  getItemById,
  getItemByShop,
} from "../controllers/item.controller.js";
import { upload } from "../middleware/multer.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/get-item/:itemId", isAuth, getItemById);
itemRouter.get("/get-item-byShop/:shopId", isAuth, getItemByShop);
itemRouter.delete("/delete-item/:itemId", isAuth, deleteItem);

export default itemRouter;
