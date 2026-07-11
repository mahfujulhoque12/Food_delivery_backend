import express from "express";
import {
  optSend,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyOtp,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.post("/signout", signOut);
authRouter.post("/sent-otp", optSend);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
