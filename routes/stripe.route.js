import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createCheckoutSession } from "../controllers/stripeController.js";
const stripeRouter = express.Router();
stripeRouter.post("/create-checkout-session", isAuth, createCheckoutSession);
export default stripeRouter;
