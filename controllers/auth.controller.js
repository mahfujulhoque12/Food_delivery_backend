import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sentOtpMail } from "../utils/mail.js";
import crypto from "crypto";

export const signUp = async (req, res) => {
  try {
    const { full_name, email, password, role, mobile } = req.body;

    // find user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password at least 6 character" });
    }
    if (mobile.length < 11) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile at least 11 character" });
    }

    // hash pass
    const hashedPassword = await bcrypt.hash(password, 10);

    //create user
    const user = await User.create({
      full_name,
      email,
      role,
      mobile,
      password: hashedPassword,
    });
    const token = await genToken(user._id);

    res.cookie("token", token, {
      sameSite: "strict",
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    console.log(error);
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }
    const token = await genToken(user._id);

    res.cookie("token", token, {
      sameSite: "strict",
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(200).json({
      success: true,
      message: "User signed in successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "User signed out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};

export const optSend = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtp = otp;
    user.otpExpired = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();
    const updatedUser = await User.findById(user._id);
    console.log(updatedUser);
    await sentOtpMail(email, otp);
    return res
      .status(200)
      .json({ success: true, message: "opt sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetOtp != otp || user.otpExpired < Date.now()) {
      return res.status(400).json({ message: "Invalid/Expired Otp" });
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpired = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "opt verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerified) {
      return res.status(400).json({ message: "Otp Verification Required" });
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    user.isOtpVerified = false;
    await user.save();
    return res.status(200).json({ message: "Password Successfully reset" });
  } catch (error) {
    {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};
