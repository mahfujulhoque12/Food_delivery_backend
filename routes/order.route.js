import express from "express";
import isAuth from "./../middleware/isAuth.js";
import {
  acceptOrder,
  getCurrentOrder,
  getDeliveryBoyAssignment,
  getOrders,
  placeOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.get("/get-orders", isAuth, getOrders);
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment);
orderRouter.get("/accept-order/:assignmentId", isAuth, acceptOrder);
orderRouter.get("/get-current-order", isAuth, getCurrentOrder);

orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);

export default orderRouter;
