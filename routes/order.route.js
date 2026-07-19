import express from "express";
import isAuth from "./../middleware/isAuth.js";
import { placeOrder } from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", isAuth, placeOrder);

export default orderRouter;
