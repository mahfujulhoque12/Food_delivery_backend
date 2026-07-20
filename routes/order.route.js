import express from "express";
import isAuth from "./../middleware/isAuth.js";
import { getOrders, placeOrder } from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.get("/get-orders", isAuth, getOrders);

export default orderRouter;
